// Picks which cards a study session shows, and in what order.

import { sourceKey } from "./packs";
import { cardState, type CardState, type Progress } from "./progress";
import type { Deck, Genre, MathTopic, Passage, Question } from "./types";

export type DeckChoice = "math" | "reading" | "mixed";
/** Reading filter groups. Drama is grouped with poetry (both are line-numbered verse here). */
export type GenreGroup = "fiction" | "poetry" | "nonfiction";
export type Mode = "practice" | "missed" | "everything";

export interface SessionConfig {
  deck: DeckChoice;
  /** Empty = all topics. */
  topics: MathTopic[];
  /** Empty = all genres. */
  genres: GenreGroup[];
  /** "released" (NAEP/MCAS) and/or private pack ids. Missing or empty = all sources. */
  sources?: string[];
  /** Target number of questions; 0 = no limit. Reading passages are never split, so a session can run a little over. */
  size: number;
  /** practice: cards not yet mastered. missed: cards whose last answer was wrong. everything: all matching cards. */
  mode: Mode;
  /** Limit the session to these question IDs (a passage, or the cards just missed). Filters and mode are ignored. */
  only?: string[];
}

export const genreGroup = (g: Genre): GenreGroup => (g === "drama" ? "poetry" : g);

/** Math cards missed in a session come back once, this many cards later. */
export const RETRY_GAP = 4;

const TIER: Record<CardState, number> = { missed: 0, new: 1, learning: 2, mastered: 3 };

export function matchesFilters(q: Question, cfg: SessionConfig, passages: Map<string, Passage>): boolean {
  if (cfg.sources && cfg.sources.length > 0 && !cfg.sources.includes(sourceKey(q))) return false;
  if (q.subject === "math") {
    if (cfg.deck === "reading") return false;
    return cfg.topics.length === 0 || (q.topic !== undefined && cfg.topics.includes(q.topic));
  }
  if (cfg.deck === "math") return false;
  if (cfg.genres.length === 0) return true;
  const p = q.passageId ? passages.get(q.passageId) : undefined;
  return !!p && cfg.genres.includes(genreGroup(p.genre));
}

export function inMode(state: CardState, mode: Mode): boolean {
  if (mode === "everything") return true;
  if (mode === "missed") return state === "missed";
  return state !== "mastered";
}

export function passageMap(deck: Deck): Map<string, Passage> {
  return new Map(deck.passages.map((p) => [p.id, p]));
}

/** Questions that match the filters and the mode. */
export function eligible(deck: Deck, progress: Progress, cfg: SessionConfig): Question[] {
  if (cfg.only) {
    const only = new Set(cfg.only);
    return deck.questions.filter((q) => only.has(q.id));
  }
  const passages = passageMap(deck);
  return deck.questions.filter((q) => matchesFilters(q, cfg, passages) && inMode(cardState(progress.cards[q.id]), cfg.mode));
}

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface Unit {
  ids: string[];
  tier: number;
}

/** Missed cards first, then new ones, then ones in progress; random within each group. */
function prioritized(units: Unit[], rng: () => number): Unit[] {
  return shuffle(units, rng).sort((a, b) => a.tier - b.tier);
}

function take(units: Unit[], limit: number): Unit[] {
  if (limit <= 0) return units;
  const out: Unit[] = [];
  let n = 0;
  for (const u of units) {
    if (n >= limit) break;
    out.push(u);
    n += u.ids.length;
  }
  return out;
}

export function buildQueue(deck: Deck, progress: Progress, cfg: SessionConfig, rng: () => number = Math.random): string[] {
  const qs = eligible(deck, progress, cfg);
  const tierOf = (q: Question) => TIER[cardState(progress.cards[q.id])];

  const mathUnits: Unit[] = qs.filter((q) => q.subject === "math").map((q) => ({ ids: [q.id], tier: tierOf(q) }));

  const byPassage = new Map<string, Question[]>();
  for (const q of qs) {
    if (q.subject !== "reading" || !q.passageId) continue;
    const list = byPassage.get(q.passageId) ?? [];
    list.push(q);
    byPassage.set(q.passageId, list);
  }
  const readingUnits: Unit[] = [...byPassage.values()].map((list) => {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return { ids: list.map((q) => q.id), tier: Math.min(...list.map(tierOf)) };
  });

  const m = prioritized(mathUnits, rng);
  const r = prioritized(readingUnits, rng);

  if (cfg.only) return interleave(m.flatMap((u) => u.ids), r.map((u) => u.ids));
  if (cfg.deck === "math") return take(m, cfg.size).flatMap((u) => u.ids);
  if (cfg.deck === "reading") return take(r, cfg.size).flatMap((u) => u.ids);

  // Mixed: about half of each, with math cards spread between reading passages.
  const mathTarget = cfg.size > 0 ? Math.ceil(cfg.size / 2) : 0;
  const readTarget = cfg.size > 0 ? cfg.size - mathTarget : 0;
  let mm = take(m, mathTarget || 0);
  let rr = take(r, readTarget || 0);
  if (cfg.size > 0) {
    // If one side runs short, let the other fill the session.
    const have = (us: Unit[]) => us.reduce((s, u) => s + u.ids.length, 0);
    const short = cfg.size - have(mm) - have(rr);
    if (short > 0) {
      if (have(mm) < mathTarget) rr = take(r, readTarget + short);
      else mm = take(m, mathTarget + short);
    }
  }
  return interleave(mm.flatMap((u) => u.ids), rr.map((u) => u.ids));
}

export function interleave(math: string[], reading: string[][]): string[] {
  if (reading.length === 0) return math;
  if (math.length === 0) return reading.flat();
  const chunk = Math.ceil(math.length / (reading.length + 1));
  const out: string[] = [];
  let i = 0;
  for (const set of reading) {
    out.push(...math.slice(i, i + chunk));
    i += chunk;
    out.push(...set);
  }
  out.push(...math.slice(i));
  return out;
}

/** Put a missed math card back into the queue a few cards later (only once per session). */
export function requeue(queue: string[], index: number, id: string, gap: number = RETRY_GAP): string[] {
  if (queue.indexOf(id, index + 1) !== -1) return queue;
  const at = Math.min(queue.length, index + 1 + gap);
  return [...queue.slice(0, at), id, ...queue.slice(at)];
}

/** SSAT raw scoring: +1 right, -1/4 wrong, 0 skipped. */
export function ssatRawScore(right: number, wrong: number): number {
  return right - wrong / 4;
}
