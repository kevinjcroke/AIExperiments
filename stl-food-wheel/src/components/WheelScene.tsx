import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useWheelStore } from "../store/wheelStore";
import { debugState, isDebug } from "../lib/debug";
import { CAMERA_FOV } from "./wheel/constants";
import { fitCamera } from "./wheel/layout";
import { createGlowTexture } from "./wheel/geometry";
import { Wheel } from "./wheel/Wheel";

declare global {
  interface Window {
    /** Exposed in dev or with ?debug=1 for leak checks (renderer.info.memory). */
    __wheelRenderer?: THREE.WebGLRenderer;
    /** Exposed in dev or with ?debug=1 so tests can drive the store. */
    __wheelStore?: typeof useWheelStore;
    __wheelDebug?: typeof debugState;
  }
}

const exposeHooks = () => import.meta.env.DEV || isDebug();

/** Local glossy reflections (no CDN HDRI): RoomEnvironment → PMREM. */
function RoomEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const rt = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.4;
    scene.environmentRotation.set(0.5, 0.4, 0);
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Backdrop() {
  const tex = useMemo(() => createGlowTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[0, 0, -2.5]} raycast={() => null}>
      <planeGeometry args={[18, 18]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function DebugHooks() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!exposeHooks()) return;
    window.__wheelRenderer = gl;
    window.__wheelStore = useWheelStore;
    window.__wheelDebug = debugState;
    return () => {
      delete window.__wheelRenderer;
      delete window.__wheelStore;
      delete window.__wheelDebug;
    };
  }, [gl]);
  return null;
}

/**
 * 3D wheel stage. Reads the store directly; takes no props.
 *  - watches `spinRequestId`; plans with `planSpin` (winner first), animates in useFrame
 *  - calls setPointerId when the wedge under the pointer changes
 *  - on completion: setPhase("settled"), select(winnerId), playWin(), confetti
 *  - writes debugState (src/lib/debug.ts) every frame
 */
export default function WheelScene() {
  const initial = fitCamera(1280, 800);
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 2]}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 100, position: [0, initial.centerY, initial.distance] }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping }}
    >
      <color attach="background" args={["#020617"]} />
      <RoomEnv />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 4, 8]} intensity={1.7} color="#fffaf0" />
      <directionalLight position={[4, -3, 5]} intensity={0.6} color="#bfdbfe" />
      <Backdrop />
      <Wheel />
      <DebugHooks />
    </Canvas>
  );
}
