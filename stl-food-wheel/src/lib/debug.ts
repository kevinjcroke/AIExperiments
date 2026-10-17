/**
 * Mutable, non-reactive debug channel (Phase 1 contract).
 * WheelScene writes these every frame / on spin events; the `?debug=1` overlay polls them.
 * Deliberately outside zustand so per-frame writes never trigger React renders.
 */
export const debugState = {
  rotation: 0,
  n: 0,
  indexAtPointer: -1,
  /** Index chosen at spin start (winner-first model). */
  winnerIndex: -1,
  winnerId: null as string | null,
  spins: 0,
  /** Spins where winnerIndex !== indexAtPointer(final rotation) or selectedId !== winnerId. */
  mismatches: 0,
};

export const isDebug = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).get("debug") === "1";
  } catch {
    return false;
  }
};
