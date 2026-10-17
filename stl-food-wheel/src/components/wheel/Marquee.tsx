import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BULB_COUNT, MARQUEE_R, MARQUEE_TUBE } from "./constants";

const ON = new THREE.Color("#fff3c4").multiplyScalar(1.6);
const OFF = new THREE.Color("#7c5a1a");
const tmp = new THREE.Color();
const m4 = new THREE.Matrix4();

/** Static (non-rotating) frame with chasing marquee bulbs — game-show dressing. */
export function Marquee({ spinningRef }: { spinningRef: RefObject<boolean> }) {
  const bulbs = useRef<THREE.InstancedMesh>(null);
  const res = useMemo(() => {
    const bulbGeo = new THREE.SphereGeometry(0.052, 16, 12);
    const bulbMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
    return { bulbGeo, bulbMat };
  }, []);
  useEffect(
    () => () => {
      res.bulbGeo.dispose();
      res.bulbMat.dispose();
    },
    [res],
  );

  useEffect(() => {
    const mesh = bulbs.current;
    if (!mesh) return;
    for (let i = 0; i < BULB_COUNT; i++) {
      const a = (i / BULB_COUNT) * Math.PI * 2;
      m4.makeTranslation(Math.cos(a) * MARQUEE_R, Math.sin(a) * MARQUEE_R, MARQUEE_TUBE * 0.9);
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, OFF);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame(() => {
    const mesh = bulbs.current;
    if (!mesh) return;
    const now = performance.now();
    const spinning = spinningRef.current;
    const step = Math.floor(now / (spinning ? 70 : 380));
    for (let i = 0; i < BULB_COUNT; i++) {
      const lit = spinning ? (i + step) % 3 === 0 : (i + step) % 2 === 0;
      const k = lit ? 1 : 0.18;
      tmp.copy(OFF).lerp(ON, k);
      mesh.setColorAt(i, tmp);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[MARQUEE_R, MARQUEE_TUBE, 20, 160]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.9} roughness={0.3} clearcoat={0.6} />
      </mesh>
      <instancedMesh ref={bulbs} args={[res.bulbGeo, res.bulbMat, BULB_COUNT]} raycast={() => null} frustumCulled={false} />
    </group>
  );
}
