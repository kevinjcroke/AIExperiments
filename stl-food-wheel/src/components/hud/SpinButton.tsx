import { forwardRef } from "react";
import { useActiveCountries, useWheelStore } from "../../store/wheelStore";
import { unlockAudio } from "../../utils/sound";
import { FOCUS_RING } from "./styles";

/** Starts a spin from a user gesture: unlock audio first (not awaited), then request. */
export function spinFromGesture() {
  void unlockAudio().catch(() => {});
  useWheelStore.getState().requestSpin();
}

export interface SpinButtonProps {
  size?: "lg" | "md";
  className?: string;
}

export const SpinButton = forwardRef<HTMLButtonElement, SpinButtonProps>(function SpinButton(
  { size = "lg", className = "" },
  ref,
) {
  const spinning = useWheelStore((s) => s.phase === "spinning");
  const active = useActiveCountries().length;
  const disabled = spinning || active === 0;
  const dims = size === "lg" ? "h-16 w-52" : "h-14 w-36";
  const text = spinning ? (size === "lg" ? "text-base" : "text-xs") : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <button
      ref={ref}
      type="button"
      onClick={spinFromGesture}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label={spinning ? "Spinning" : "Spin the wheel"}
      aria-keyshortcuts="Space"
      className={[
        "group relative select-none rounded-full font-black uppercase tracking-[0.18em] text-white",
        "bg-gradient-to-b from-rose-400 via-rose-500 to-rose-700",
        "shadow-[0_6px_0_0_#881337,0_14px_28px_-6px_rgba(244,63,94,0.55)]",
        "ring-1 ring-inset ring-white/25",
        "transition-[transform,box-shadow,filter] duration-100",
        "hover:brightness-110 active:translate-y-[5px] active:shadow-[0_1px_0_0_#881337,0_6px_14px_-6px_rgba(244,63,94,0.5)]",
        "disabled:cursor-not-allowed disabled:from-slate-500 disabled:via-slate-600 disabled:to-slate-700",
        "disabled:shadow-[0_6px_0_0_#1e293b] disabled:text-slate-200 disabled:hover:brightness-100",
        "disabled:active:translate-y-0",
        FOCUS_RING,
        dims,
        className,
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-x-3 top-1 h-1/3 rounded-full bg-white/25 blur-[1px]" />
      <span className={`relative drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] ${text}`}>{spinning ? "Spinning…" : "Spin"}</span>
    </button>
  );
});
