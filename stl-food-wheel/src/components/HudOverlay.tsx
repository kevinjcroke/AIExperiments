import type { ReactNode } from "react";

export interface HudOverlayProps {
  /** The 3D canvas (<WheelScene/>). HudOverlay owns the responsive layout around it. */
  stage: ReactNode;
}

/** HUD, filters, eliminated list, drawer container, toasts (Agent 3). */
export function HudOverlay({ stage }: HudOverlayProps) {
  return (
    <div className="flex h-dvh w-full bg-slate-950 text-slate-100">
      <main className="relative flex-1">{stage}</main>
    </div>
  );
}
