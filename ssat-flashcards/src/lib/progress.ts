// Per-card results and mastery, saved in localStorage.

export interface CardStat {
  right: number;
  wrong: number;
  last: "right" | "wrong";
  /** ms since epoch of the last answer */
  at: number;
}

export interface Progress {
  v: 1;
  cards: Record<string, CardStat>;
  /** Local dates (YYYY-MM-DD) with at least one answer, oldest first, capped. */
  days: string[];
}

/** A card is mastered once it has been answered right at least this many more times than wrong. */
export const MASTERY_MARGIN = 2;
const MAX_DAYS = 120;
export const STORAGE_KEY = "upper-hand/progress/v1";

export const emptyProgress = (): Progress => ({ v: 1, cards: {}, days: [] });

export function isMastered(s: CardStat | undefined): boolean {
  return !!s && s.right - s.wrong >= MASTERY_MARGIN;
}

/** How many more right answers (with no misses) the card needs to be mastered. */
export function rightToMaster(s: CardStat | undefined): number {
  if (!s) return MASTERY_MARGIN;
  return Math.max(0, MASTERY_MARGIN - (s.right - s.wrong));
}

export type CardState = "new" | "missed" | "learning" | "mastered";

export function cardState(s: CardStat | undefined): CardState {
  if (!s) return "new";
  if (isMastered(s)) return "mastered";
  if (s.last === "wrong") return "missed";
  return "learning";
}

export function localDay(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function record(p: Progress, id: string, correct: boolean, now: number): Progress {
  const prev = p.cards[id];
  const next: CardStat = {
    right: (prev?.right ?? 0) + (correct ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    last: correct ? "right" : "wrong",
    at: now,
  };
  const day = localDay(now);
  const days = p.days[p.days.length - 1] === day ? p.days : [...p.days, day].slice(-MAX_DAYS);
  return { ...p, cards: { ...p.cards, [id]: next }, days };
}

/** Consecutive study days ending today (or yesterday, so the streak survives until tonight). */
export function streak(days: string[], now: number): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  const oneDay = 86_400_000;
  let t = now;
  if (!set.has(localDay(t))) {
    t -= oneDay;
    if (!set.has(localDay(t))) return 0;
  }
  let n = 0;
  while (set.has(localDay(t))) {
    n++;
    t -= oneDay;
  }
  return n;
}

const isCount = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x) && x >= 0 && x < 1e6;

/** Parse stored JSON defensively: anything malformed is dropped rather than crashing the app. */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  try {
    const d = JSON.parse(raw) as Partial<Progress>;
    if (!d || d.v !== 1 || typeof d.cards !== "object" || d.cards === null) return emptyProgress();
    const cards: Record<string, CardStat> = {};
    for (const [id, s] of Object.entries(d.cards as Record<string, Partial<CardStat>>)) {
      if (s && isCount(s.right) && isCount(s.wrong) && (s.last === "right" || s.last === "wrong")) {
        cards[id] = { right: s.right, wrong: s.wrong, last: s.last, at: typeof s.at === "number" ? s.at : 0 };
      }
    }
    const days = Array.isArray(d.days) ? d.days.filter((x): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)) : [];
    return { v: 1, cards, days: days.slice(-MAX_DAYS) };
  } catch {
    return emptyProgress();
  }
}

export function loadProgress(storage: Pick<Storage, "getItem"> | undefined): Progress {
  try {
    return parseProgress(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage: Pick<Storage, "setItem"> | undefined, p: Progress): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Private mode or full storage: progress just won't persist.
  }
}
