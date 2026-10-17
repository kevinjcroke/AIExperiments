/**
 * Wheel math — pure functions, no Three.js dependency.
 *
 * Coordinate convention:
 * - The wheel lies in the XY plane facing the camera and rotates about +Z.
 *   `rotation` is the wheel group's `rotation.z` in radians.
 * - In wheel-local space, wedge `i` of `n` spans angles [i·θ, (i+1)·θ),
 *   measured counter-clockwise from +X, where θ = 2π / n.
 * - The pointer sits at world angle P = π/2 (12 o'clock).
 * - The wheel spins clockwise, so `rotation` decreases during a spin.
 *
 * A wheel-local angle `a` appears at world angle `a + rotation`, so the local
 * angle under the pointer is `P - rotation`.
 */

export const TAU = Math.PI * 2;
export const POINTER_ANGLE = Math.PI / 2;

export const mod = (a: number, m: number) => ((a % m) + m) % m;

export function sliceAngle(n: number): number {
  return n > 0 ? TAU / n : TAU;
}

export function indexAtPointer(rotation: number, n: number): number {
  if (n <= 0) return -1;
  const i = Math.floor(mod(POINTER_ANGLE - rotation, TAU) / sliceAngle(n));
  // Guard against floating-point landing exactly on 2π.
  return Math.min(i, n - 1);
}

/** Not wrapped: the difference between two frames = number of peg boundaries crossed. */
export function pegStep(rotation: number, n: number): number {
  if (n <= 0) return 0;
  return Math.floor((POINTER_ANGLE - rotation) / sliceAngle(n));
}

/**
 * Rotation at which wedge `index` sits under the pointer (offset by `jitter`
 * wedge-widths from its centre), at least `turns` full turns clockwise from `current`.
 */
export function targetRotation(
  current: number,
  index: number,
  n: number,
  opts: { turns: number; jitter: number },
): number {
  const theta = sliceAngle(n);
  const jitter = Math.max(-0.35, Math.min(0.35, opts.jitter));
  const base = POINTER_ANGLE - (index + 0.5 + jitter) * theta;
  const delta = mod(current - base, TAU);
  return current - delta - opts.turns * TAU;
}

/** Shortest-path rotation (either direction) that puts wedge `index`'s centre under the pointer. */
export function nearestRotationFor(current: number, index: number, n: number): number {
  const base = POINTER_ANGLE - (index + 0.5) * sliceAngle(n);
  let delta = mod(base - current, TAU);
  if (delta > Math.PI) delta -= TAU;
  return current + delta;
}

export const easeOutQuart = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 4);

export const SPIN_DURATION_MS = 4500;
export const REDUCED_SPIN_DURATION_MS = 600;
export const MIN_TURNS = 4;
export const MAX_TURNS = 6;
export const MAX_JITTER = 0.35;

export interface SpinPlan {
  winnerIndex: number;
  from: number;
  to: number;
  durationMs: number;
}

/**
 * Choose the winner first, then compute where to animate to.
 * `rand` is injectable for tests.
 */
export function planSpin(
  current: number,
  n: number,
  opts: { reducedMotion?: boolean; rand?: () => number } = {},
): SpinPlan {
  const rand = opts.rand ?? Math.random;
  const winnerIndex = Math.min(n - 1, Math.floor(rand() * n));
  const reduced = opts.reducedMotion ?? false;
  // Reduced motion: turns = 0 keeps total travel under one full revolution.
  const turns = reduced ? 0 : MIN_TURNS + Math.floor(rand() * (MAX_TURNS - MIN_TURNS + 1));
  const jitter = (rand() * 2 - 1) * MAX_JITTER;
  return {
    winnerIndex,
    from: current,
    to: targetRotation(current, winnerIndex, n, { turns, jitter }),
    durationMs: reduced ? REDUCED_SPIN_DURATION_MS : SPIN_DURATION_MS,
  };
}
