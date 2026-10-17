/**
 * Saturated game-show palette. Order is chosen so consecutive colours contrast strongly.
 * `wedgeColorIndices` guarantees adjacent wedges never share a colour, including the
 * wrap-around pair (last ↔ first), for every n (odd, even, 1, 2).
 */
export const WEDGE_COLORS = [
  "#e11d48", // crimson
  "#2563eb", // royal blue
  "#f59e0b", // amber
  "#16a34a", // green
  "#7c3aed", // violet
  "#f97316", // orange
  "#0891b2", // teal
  "#db2777", // magenta
] as const;

export function wedgeColorIndices(n: number): number[] {
  const P = WEDGE_COLORS.length;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i % P);
  // With a simple cycle the only possible clash is last ↔ first, which happens exactly when
  // (n - 1) % P === 0 (e.g. n = 9, 17 …). n = 1 has no neighbours. Odd n never causes
  // another clash because P > 2 — but we fix any clash generically to stay safe.
  if (n > 2) {
    const last = n - 1;
    const prev = out[last - 1]!;
    const first = out[0]!;
    if (out[last] === first || out[last] === prev) {
      for (let c = 0; c < P; c++) {
        if (c !== prev && c !== first) {
          out[last] = c;
          break;
        }
      }
    }
  }
  return out;
}
