import { describe, expect, it } from "vitest";
import {
  TAU,
  easeOutQuart,
  indexAtPointer,
  mod,
  nearestRotationFor,
  pegStep,
  planSpin,
  sliceAngle,
  targetRotation,
} from "./wheelMath";

// Deterministic PRNG (mulberry32) so failures are reproducible.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("basics", () => {
  it("mod is always non-negative", () => {
    expect(mod(-1, 5)).toBe(4);
    expect(mod(7, 5)).toBe(2);
    expect(mod(-TAU, TAU)).toBeCloseTo(0);
  });

  it("sliceAngle", () => {
    expect(sliceAngle(4)).toBeCloseTo(Math.PI / 2);
    expect(sliceAngle(1)).toBeCloseTo(TAU);
  });

  it("wedge 0 is under the pointer when rotation puts [0, θ) at 12 o'clock", () => {
    expect(indexAtPointer(0, 4)).toBe(1); // local π/2 is the start of wedge 1
    expect(indexAtPointer(Math.PI / 2 - 0.01, 4)).toBe(0);
  });

  it("easeOutQuart endpoints", () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
  });
});

describe("targetRotation lands on the chosen wedge", () => {
  it("for every n in 1..30, 200 random currents, every index, random jitter", () => {
    const rand = rng(42);
    for (let n = 1; n <= 30; n++) {
      for (let k = 0; k < 200; k++) {
        const current = (rand() * 2 - 1) * 1000;
        for (let index = 0; index < n; index++) {
          const turns = 4 + Math.floor(rand() * 3);
          const jitter = (rand() * 2 - 1) * 0.35;
          const target = targetRotation(current, index, n, { turns, jitter });
          expect(indexAtPointer(target, n)).toBe(index);
          expect(target).toBeLessThanOrEqual(current - turns * TAU + 1e-9);
          expect(target).toBeGreaterThan(current - (turns + 1) * TAU - 1e-9);
        }
      }
    }
  });

  it("planSpin's winner is always the wedge under the pointer at the end", () => {
    const rand = rng(7);
    for (let n = 1; n <= 30; n++) {
      let current = 0;
      for (let k = 0; k < 50; k++) {
        const plan = planSpin(current, n, { rand });
        expect(plan.winnerIndex).toBeGreaterThanOrEqual(0);
        expect(plan.winnerIndex).toBeLessThan(n);
        expect(indexAtPointer(plan.to, n)).toBe(plan.winnerIndex);
        expect(plan.to).toBeLessThan(plan.from);
        current = plan.to;
      }
    }
  });

  it("reduced-motion spins travel at most one turn", () => {
    const rand = rng(99);
    for (let n = 1; n <= 30; n++) {
      const plan = planSpin(rand() * 50, n, { rand, reducedMotion: true });
      expect(plan.from - plan.to).toBeLessThanOrEqual(TAU);
      expect(plan.durationMs).toBe(600);
      expect(indexAtPointer(plan.to, n)).toBe(plan.winnerIndex);
    }
  });
});

describe("pegStep", () => {
  it("delta equals the number of wedge boundaries crossed", () => {
    const rand = rng(3);
    for (let n = 1; n <= 30; n++) {
      const theta = sliceAngle(n);
      for (let k = 0; k < 100; k++) {
        const start = (rand() * 2 - 1) * 100;
        const span = rand() * 6 * TAU; // clockwise travel
        const end = start - span;
        // Count boundaries b (local angle P - rotation crosses multiples of θ) in (u0, u1]
        const u0 = Math.PI / 2 - start;
        const u1 = Math.PI / 2 - end;
        const crossed = Math.floor(u1 / theta) - Math.floor(u0 / theta);
        expect(pegStep(end, n) - pegStep(start, n)).toBe(crossed);
        // Sanity: crossed ≈ span / θ (±1)
        expect(Math.abs(crossed - span / theta)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("summing per-frame deltas over an animated spin equals total crossings", () => {
    const n = 12;
    const from = 0.3;
    const to = targetRotation(from, 5, n, { turns: 5, jitter: 0.1 });
    let last = pegStep(from, n);
    let total = 0;
    for (let f = 1; f <= 270; f++) {
      const r = from + (to - from) * easeOutQuart(f / 270);
      const s = pegStep(r, n);
      total += s - last;
      last = s;
    }
    expect(total).toBe(pegStep(to, n) - pegStep(from, n));
    expect(total).toBeGreaterThanOrEqual(5 * n);
  });
});

describe("nearestRotationFor", () => {
  it("puts the wedge centre under the pointer, moving at most half a turn", () => {
    const rand = rng(11);
    for (let n = 1; n <= 30; n++) {
      for (let index = 0; index < n; index++) {
        const current = (rand() * 2 - 1) * 100;
        const r = nearestRotationFor(current, index, n);
        expect(indexAtPointer(r, n)).toBe(index);
        expect(Math.abs(r - current)).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });
});
