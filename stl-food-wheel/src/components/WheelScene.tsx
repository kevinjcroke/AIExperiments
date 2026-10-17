/**
 * 3D wheel (Agent 2). Reads the store directly; takes no props.
 * Contract:
 *  - watches `spinRequestId`; on change plans a spin with `planSpin` (winner first), animates in useFrame
 *  - calls setPointerId when the wedge under the pointer changes
 *  - on completion: setPhase("settled"), select(winnerId), playWin(), confetti
 *  - writes debugState (src/lib/debug.ts) every frame
 */
export default function WheelScene() {
  return <div className="grid h-full w-full place-items-center text-slate-400">Wheel goes here</div>;
}
