import { Suspense, lazy, useEffect } from "react";
import WheelScene from "./components/WheelScene";
import { HudOverlay } from "./components/HudOverlay";
import { isDebug } from "./lib/debug";
import { useWheelStore } from "./store/wheelStore";
import { setMuted } from "./utils/sound";

const DebugOverlay = lazy(() => import("./components/DebugOverlay"));
const debug = isDebug();

export default function App() {
  const muted = useWheelStore((s) => s.muted);
  useEffect(() => setMuted(muted), [muted]);

  return (
    <>
      <HudOverlay stage={<WheelScene />} />
      {debug && (
        <Suspense fallback={null}>
          <DebugOverlay />
        </Suspense>
      )}
    </>
  );
}
