/** Shared Tailwind class fragments for the HUD. */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

/**
 * Distance from the top of the stage to the readout pill, which labels the
 * 12 o'clock pointer from just above its tip. Tuned against WheelScene's camera
 * framing: desktop wheel fills the stage height, mobile leaves more headroom.
 */
export const READOUT_TOP_PX = { desktop: 20, mobile: 64 } as const;

export const GLASS = "backdrop-blur-md bg-slate-900/80";

export const SR_ONLY = "sr-only";
