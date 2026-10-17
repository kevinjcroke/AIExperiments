import { Suspense, lazy, useEffect } from "react";
import { HudOverlay } from "./components/HudOverlay";
import { isDebug } from "./lib/debug";
import { useWheelStore } from "./store/wheelStore";
import { setMuted } from "./utils/sound";

// three + R3F + drei are the bulk of the bundle; the HUD paints first while they load.
const WheelScene = lazy(() => import("./components/WheelScene"));
const DebugOverlay = lazy(() => import("./components/DebugOverlay"));
const debug = isDebug();

function WheelLoading() {
  return (
    <div role="status" className="grid h-full w-full place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-300">
        <div className="size-16 animate-spin rounded-full border-4 border-amber-300/20 border-t-amber-300 motion-reduce:animate-none" />
        <span className="text-sm font-medium">Loading the wheel…</span>
      </div>
    </div>
  );
}

export default function App() {
  const muted = useWheelStore((s) => s.muted);
  useEffect(() => setMuted(muted), [muted]);

  return (
    <>
      <HudOverlay
        stage={
          <Suspense fallback={<WheelLoading />}>
            <WheelScene />
          </Suspense>
        }
      />
      {debug && (
        <Suspense fallback={null}>
          <DebugOverlay />
        </Suspense>
      )}
    </>
  );
}
