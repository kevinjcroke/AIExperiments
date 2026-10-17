import { Volume2, VolumeX } from "lucide-react";
import { useWheelStore } from "../../store/wheelStore";
import { FOCUS_RING } from "./styles";

export function MuteButton() {
  const muted = useWheelStore((s) => s.muted);
  const toggleMute = useWheelStore((s) => s.toggleMute);
  const Icon = muted ? VolumeX : Volume2;
  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-pressed={muted}
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      title={muted ? "Unmute" : "Mute"}
      className={`grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-slate-100 ring-1 ring-white/10 transition hover:bg-white/10 ${FOCUS_RING}`}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
