import { useEffect } from "react";
import WheelScene from "./components/WheelScene";
import { HudOverlay } from "./components/HudOverlay";
import { useWheelStore } from "./store/wheelStore";
import { setMuted } from "./utils/sound";

export default function App() {
  const muted = useWheelStore((s) => s.muted);
  useEffect(() => setMuted(muted), [muted]);

  return <HudOverlay stage={<WheelScene />} />;
}
