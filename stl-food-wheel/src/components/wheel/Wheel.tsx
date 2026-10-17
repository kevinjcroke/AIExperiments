import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import confetti from "canvas-confetti";
import type { CountryNode } from "../../types/wheel";
import { selectActiveCountries, useActiveCountries, useWheelStore } from "../../store/wheelStore";
import {
  TAU,
  easeOutQuart,
  indexAtPointer,
  mod,
  nearestRotationFor,
  pegStep,
  planSpin,
  sliceAngle,
} from "../../lib/wheelMath";
import { debugState } from "../../lib/debug";
import { prefersReducedMotion, useIsDesktop } from "../../lib/useMediaQuery";
import { getFlagTexture } from "../../utils/flagTexture";
import { playTick, playWin } from "../../utils/sound";
import {
  FLAPPER_PIVOT_Y,
  FLAPPER_Z,
  FRONT_Z,
  HUB_R,
  PEG_BASE_Z,
  PEG_R,
  PEG_RADIUS_POS,
  PEG_TOP_Z,
  RIM_R,
  RIM_TUBE,
  RIM_Z,
  WHEEL_R,
} from "./constants";
import { WEDGE_COLORS, wedgeColorIndices } from "./palette";
import { LABEL_Z, fitCamera, flagLayout, textLayout, type TextLayout } from "./layout";
import { LABEL_FONT_URL, LABEL_LETTER_SPACING, useLabelMeasure } from "./labelFont";
import { createFlapperGeometry, createWedgeGeometry } from "./geometry";
import { Marquee } from "./Marquee";

type Anim =
  | {
      kind: "spin";
      from: number;
      to: number;
      duration: number;
      start: number;
      winnerIndex: number;
      winnerId: string;
      countries: CountryNode[];
      reduced: boolean;
    }
  | {
      kind: "wobble";
      base: number;
      duration: number;
      start: number;
      winnerIndex: number;
      winnerId: string;
      countries: CountryNode[];
      reduced: boolean;
    }
  | { kind: "nudge"; from: number; to: number; duration: number; start: number };

const POP_MS = 250;
const NUDGE_MAX_MS = 600;
const NUDGE_MIN_MS = 220;
const TICK_MIN_GAP_MS = 25;
const SETTLED_ZOOM = 0.9;
const FLAP_KICK = 0.42;
const FLAP_K = 320;
const FLAP_C = 16;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const noRaycast = () => null;

function indexOfId(list: readonly CountryNode[], id: string | null): number {
  if (id == null) return -1;
  for (let i = 0; i < list.length; i++) if (list[i]!.id === id) return i;
  return -1;
}

export function Wheel() {
  const countries = useActiveCountries();
  const n = countries.length;
  const desktop = useIsDesktop();
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const wheelRef = useRef<THREE.Group>(null);
  const popRef = useRef<THREE.Group>(null);
  const flapperRef = useRef<THREE.Group>(null);
  const spinningRef = useRef(false);

  // Animation state lives in refs — never React state.
  const rot = useRef(0);
  const anim = useRef<Anim | null>(null);
  const countriesRef = useRef(countries);
  const lastPeg = useRef(0);
  const lastN = useRef(-1);
  const lastTickAt = useRef(-Infinity);
  const flap = useRef({ angle: 0, vel: 0 });
  const hover = useRef(-1);
  const zoom = useRef(1);
  const zoomTarget = useRef(1);
  const popStart = useRef(-1);

  countriesRef.current = countries; // read by useFrame; rendered list and frame logic stay in sync

  // Scale "pop" when the number of wedges changes (not on first mount).
  const prevN = useRef(n);
  useEffect(() => {
    if (prevN.current !== n && !prefersReducedMotion()) popStart.current = performance.now();
    prevN.current = n;
  }, [n]);

  // ---------- GPU resources (allocated per n / per country set, disposed on change) ----------
  const wedgeGeo = useMemo(() => createWedgeGeometry(n), [n]);
  useEffect(() => () => wedgeGeo.dispose(), [wedgeGeo]);

  const wedgeMats = useMemo(
    () =>
      wedgeColorIndices(n).map((ci) => {
        const color = new THREE.Color(WEDGE_COLORS[ci]);
        return new THREE.MeshPhysicalMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0,
          roughness: 0.3,
          metalness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          envMapIntensity: 0.55,
        });
      }),
    [n],
  );
  useEffect(() => () => wedgeMats.forEach((m) => m.dispose()), [wedgeMats]);

  // Flag textures are app-lifetime cached (contract) — only the materials are ours.
  const flagMats = useMemo(
    () =>
      countries.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            map: getFlagTexture(c.isoCode),
            transparent: true,
            roughness: 0.42,
            metalness: 0,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
          }),
      ),
    [countries],
  );
  useEffect(() => () => flagMats.forEach((m) => m.dispose()), [flagMats]);

  const shared = useMemo(() => {
    const flagPlane = new THREE.PlaneGeometry(1, 0.75);
    const pegGeo = new THREE.CylinderGeometry(PEG_R, PEG_R * 1.15, PEG_TOP_Z - PEG_BASE_Z, 16);
    pegGeo.rotateX(Math.PI / 2);
    const pegCapGeo = new THREE.SphereGeometry(PEG_R * 1.25, 16, 12);
    const chrome = new THREE.MeshPhysicalMaterial({
      color: "#f1f5f9",
      metalness: 1,
      roughness: 0.14,
      clearcoat: 0.6,
    });
    const gold = new THREE.MeshPhysicalMaterial({
      color: "#fbbf24",
      metalness: 1,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });
    const flapperGeo = createFlapperGeometry();
    const flapperMat = new THREE.MeshPhysicalMaterial({
      color: "#c81414",
      roughness: 0.45,
      metalness: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.4,
    });
    return { flagPlane, pegGeo, pegCapGeo, chrome, gold, flapperGeo, flapperMat };
  }, []);
  useEffect(
    () => () => {
      Object.values(shared).forEach((r) => r.dispose());
    },
    [shared],
  );

  // ---------- label layout ----------
  const theta = sliceAngle(n);
  const flag = useMemo(() => flagLayout(n, desktop), [n, desktop]);
  const measure = useLabelMeasure();
  const labels = useMemo(
    () => countries.map((c) => (desktop ? textLayout(c.shortName, n, flag, measure) : null)),
    [countries, desktop, n, flag, measure],
  );

  const cam = useMemo(() => fitCamera(size.width, size.height), [size.width, size.height]);

  // ---------- spin requests ----------
  useEffect(() => {
    const startSpin = () => {
      const s = useWheelStore.getState();
      const list = selectActiveCountries(s); // captured: frozen for this spin
      const nn = list.length;
      if (nn === 0) {
        s.setPhase("idle");
        return;
      }
      const reduced = prefersReducedMotion();
      zoomTarget.current = 1;
      if (nn === 1) {
        const only = list[0]!;
        anim.current = {
          kind: "wobble",
          base: rot.current,
          duration: reduced ? 250 : 750,
          start: -1,
          winnerIndex: 0,
          winnerId: only.id,
          countries: list,
          reduced,
        };
        debugState.winnerIndex = 0;
        debugState.winnerId = only.id;
        return;
      }
      const plan = planSpin(rot.current, nn, { reducedMotion: reduced });
      const winner = list[plan.winnerIndex]!;
      anim.current = {
        kind: "spin",
        from: plan.from,
        to: plan.to,
        duration: plan.durationMs,
        start: -1,
        winnerIndex: plan.winnerIndex,
        winnerId: winner.id,
        countries: list,
        reduced,
      };
      debugState.winnerIndex = plan.winnerIndex;
      debugState.winnerId = winner.id;
    };
    return useWheelStore.subscribe((s, prev) => {
      if (s.spinRequestId !== prev.spinRequestId) startSpin();
    });
  }, []);

  // Reset the cursor if we unmount while hovering.
  useEffect(() => {
    const el = gl.domElement;
    return () => {
      el.style.cursor = "";
    };
  }, [gl]);

  // ---------- per-frame ----------
  useFrame((_, delta) => {
    const now = performance.now();
    const dt = Math.min(delta, 1 / 30);
    const s = useWheelStore.getState();
    let a = anim.current;
    const list = a && a.kind !== "nudge" ? a.countries : countriesRef.current;
    const nn = list.length;
    let r = rot.current;
    let finished: Anim | null = null;

    // Direct selection (click / external select): rotate the short way to the selected wedge.
    if (s.phase !== "spinning" && (!a || a.kind === "nudge") && s.selectedId != null && nn > 0) {
      const idx = indexOfId(list, s.selectedId);
      const dest = a ? a.to : r;
      if (idx >= 0 && indexAtPointer(dest, nn) !== idx) {
        const to = nearestRotationFor(r, idx, nn);
        const dur = Math.max(NUDGE_MIN_MS, Math.min(NUDGE_MAX_MS, (Math.abs(to - r) / Math.PI) * NUDGE_MAX_MS));
        a = anim.current = { kind: "nudge", from: r, to, duration: prefersReducedMotion() ? NUDGE_MIN_MS : dur, start: now };
      }
    }

    if (a) {
      if (a.start < 0) a.start = now;
      const t = Math.min(1, (now - a.start) / a.duration);
      if (a.kind === "spin") r = a.from + (a.to - a.from) * easeOutQuart(t);
      else if (a.kind === "nudge") r = a.from + (a.to - a.from) * easeOutCubic(t);
      else r = a.base + (a.reduced ? 0 : 0.16 * Math.sin(t * Math.PI * 5) * (1 - t) * (1 - t));
      if (t >= 1) {
        r = a.kind === "wobble" ? a.base : a.to;
        finished = a;
        anim.current = null;
      }
    }
    // Keep rotation bounded once nothing is animating (exact multiple of 2π: pointer index unchanged).
    if (!anim.current && Math.abs(r) > TAU * 8) {
      r = mod(r, TAU);
      lastN.current = -1; // re-seed peg tracking without a tick
    }
    rot.current = r;
    spinningRef.current = s.phase === "spinning";
    const wheel = wheelRef.current;
    if (wheel) wheel.rotation.z = r;

    // Pegs passing the pointer → flapper kick + tick (max one per frame, ≥ 25 ms apart).
    if (nn !== lastN.current) {
      lastN.current = nn;
      lastPeg.current = pegStep(r, nn);
    } else if (nn > 1) {
      const step = pegStep(r, nn);
      if (step !== lastPeg.current) {
        flap.current.angle = step > lastPeg.current ? FLAP_KICK : -FLAP_KICK;
        flap.current.vel = 0;
        lastPeg.current = step;
        if (now - lastTickAt.current >= TICK_MIN_GAP_MS) {
          lastTickAt.current = now;
          playTick();
        }
      }
    }
    const f = flap.current;
    f.vel += (-FLAP_K * f.angle - FLAP_C * f.vel) * dt;
    f.angle += f.vel * dt;
    if (flapperRef.current) flapperRef.current.rotation.z = f.angle;

    // Live pointer readout (by id — n can change between frames).
    const pIdx = indexAtPointer(r, nn);
    const pId = pIdx >= 0 ? (list[pIdx]?.id ?? null) : null;
    if (pId !== s.pointerId) s.setPointerId(pId);

    debugState.rotation = r;
    debugState.n = nn;
    debugState.indexAtPointer = pIdx;

    // Spin completion.
    if (finished && finished.kind !== "nudge") {
      s.setPhase("settled");
      s.select(finished.winnerId);
      debugState.spins++;
      if (
        indexAtPointer(r, nn) !== finished.winnerIndex ||
        useWheelStore.getState().selectedId !== finished.winnerId
      ) {
        debugState.mismatches++;
      }
      playWin();
      if (!finished.reduced) {
        zoomTarget.current = SETTLED_ZOOM;
        const rect = gl.domElement.getBoundingClientRect();
        const vw = window.innerWidth || 1;
        const vh = window.innerHeight || 1;
        void confetti({
          particleCount: 140,
          spread: 80,
          startVelocity: 42,
          ticks: 220,
          origin: { x: (rect.left + rect.width / 2) / vw, y: (rect.top + rect.height * 0.3) / vh },
          colors: [...WEDGE_COLORS, "#ffffff", "#fde68a"],
          disableForReducedMotion: true,
        });
      }
    }

    // Emissive: hover glow + pulsing winner/selection.
    const spinning = s.phase === "spinning";
    if (spinning && hover.current >= 0) {
      hover.current = -1;
      gl.domElement.style.cursor = "";
    }
    const selIdx = spinning ? -1 : indexOfId(list, s.selectedId);
    const pulse = 0.14 + 0.1 * Math.sin(now / 220);
    for (let i = 0; i < wedgeMats.length; i++) {
      const m = wedgeMats[i]!;
      m.emissiveIntensity = (i === selIdx ? pulse : 0) + (i === hover.current ? 0.16 : 0);
    }

    // Wheel "pop" on n change.
    const pop = popRef.current;
    if (pop) {
      let sc = 1;
      if (popStart.current >= 0) {
        const t = (now - popStart.current) / POP_MS;
        if (t >= 1) popStart.current = -1;
        else sc = 1 + 0.07 * Math.sin(Math.PI * t);
      }
      pop.scale.setScalar(sc);
    }

    // Camera: fit to aspect, ease ~10% closer after a win, back on the next spin.
    zoom.current += (zoomTarget.current - zoom.current) * (1 - Math.exp(-dt * 3));
    camera.position.set(0, cam.centerY, cam.distance * zoom.current);
  });

  // ---------- events ----------
  const onMove = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (spinningRef.current) return;
    if (hover.current !== i) {
      hover.current = i;
      gl.domElement.style.cursor = "pointer";
    }
  };
  const onOut = (i: number) => () => {
    if (hover.current === i) {
      hover.current = -1;
      gl.domElement.style.cursor = "";
    }
  };
  const onClick = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const s = useWheelStore.getState();
    if (s.phase === "spinning") return;
    s.select(id);
  };

  const flagScale = flag.w;

  return (
    <group>
      <Marquee spinningRef={spinningRef} />

      {/* Pointer / flapper at 12 o'clock (static; pivots when pegs pass). */}
      <group position={[0, FLAPPER_PIVOT_Y, FLAPPER_Z]}>
        <group ref={flapperRef}>
          <mesh geometry={shared.flapperGeo} material={shared.flapperMat} />
        </group>
        <mesh position={[0, 0, 0.06]} material={shared.gold}>
          <sphereGeometry args={[0.065, 24, 16]} />
        </mesh>
      </group>

      <group ref={popRef}>
        {/* Static backing disc so seams read as dark grooves. */}
        <mesh position={[0, 0, 0.02]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[WHEEL_R + 0.02, WHEEL_R + 0.02, 0.08, 96]} />
          <meshStandardMaterial color="#0b1224" roughness={0.6} metalness={0.3} />
        </mesh>

        <group ref={wheelRef}>
          {countries.map((c, i) => (
            <mesh
              key={c.id}
              geometry={wedgeGeo}
              material={wedgeMats[i]}
              rotation-z={(i + 0.5) * theta}
              onPointerMove={onMove(i)}
              onPointerOut={onOut(i)}
              onClick={onClick(c.id)}
            />
          ))}

          {/* Flags + names along each bisector. */}
          {countries.map((c, i) => {
            const label = labels[i];
            return (
              <group key={c.id} rotation-z={(i + 0.5) * theta}>
                <mesh
                  geometry={shared.flagPlane}
                  material={flagMats[i]}
                  position={[flag.r, 0, LABEL_Z]}
                  rotation-z={-Math.PI / 2}
                  scale={flagScale}
                  raycast={noRaycast}
                />
                {label && (
                  <Suspense fallback={null}>
                    <LabelText text={c.shortName} layout={label} />
                  </Suspense>
                )}
              </group>
            );
          })}

          {/* Rotating rim + pegs at every wedge boundary (none for a single full disc). */}
          <mesh position={[0, 0, RIM_Z]} material={shared.gold}>
            <torusGeometry args={[RIM_R, RIM_TUBE, 24, 160]} />
          </mesh>
          {n > 1 &&
            countries.map((c, i) => {
              const ang = i * theta;
              const x = Math.cos(ang) * PEG_RADIUS_POS;
              const y = Math.sin(ang) * PEG_RADIUS_POS;
              return (
                <group key={c.id} position={[x, y, 0]}>
                  <mesh geometry={shared.pegGeo} material={shared.chrome} position={[0, 0, (PEG_BASE_Z + PEG_TOP_Z) / 2]} />
                  <mesh geometry={shared.pegCapGeo} material={shared.chrome} position={[0, 0, PEG_TOP_Z]} />
                </group>
              );
            })}

          {/* Hub cap */}
          <mesh position={[0, 0, FRONT_Z + 0.02]} rotation-x={Math.PI / 2} material={shared.gold}>
            <cylinderGeometry args={[HUB_R, HUB_R * 1.04, 0.1, 64]} />
          </mesh>
          <mesh position={[0, 0, FRONT_Z + 0.07]} rotation-x={Math.PI / 2} scale={[1, 0.42, 1]} material={shared.chrome}>
            <sphereGeometry args={[HUB_R * 0.78, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Radial country name (size pre-fitted in layout.ts using real font metrics once loaded). */
function LabelText({ text, layout }: { text: string; layout: TextLayout }) {
  return (
    <Text
      font={LABEL_FONT_URL}
      position={[layout.rEnd, 0, LABEL_Z + 0.002]}
      fontSize={layout.fontSize}
      maxWidth={layout.maxWidth}
      whiteSpace="nowrap"
      anchorX="right"
      anchorY="middle"
      letterSpacing={LABEL_LETTER_SPACING}
      color="#ffffff"
      outlineWidth="10%"
      outlineColor="#0f172a"
      outlineOpacity={0.8}
      raycast={noRaycast}
    >
      {text}
    </Text>
  );
}
