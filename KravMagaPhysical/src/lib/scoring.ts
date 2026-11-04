/**
 * Scoring and the rebalancing planner.
 *
 * Every event is scored 0-100 from a chart; the test score is the average of the four.
 * Locked events keep the user's value. Auto events split whatever points are still
 * needed as evenly as possible, so the average lands exactly on the requirement.
 */
import { tableFor, type ScoreTable } from "./charts";
import {
  EVENT_IDS,
  outcomeFor,
  rankById,
  type EventId,
  type LockedValues,
  type Outcome,
  type Profile,
} from "./model";

export const MAX_POINTS = 100;

/** Points earned for a raw value: the best row of the chart the value reaches. */
export function scoreFor(table: ScoreTable, value: number): number {
  const { values } = table.bracket;
  for (let p = MAX_POINTS; p >= 0; p--) {
    const threshold = values[p];
    if (threshold === null || threshold === undefined) continue;
    if (table.better === "higher" ? value >= threshold : value <= threshold) return p;
  }
  return 0;
}

/** The least effort that still earns `points`: fewest reps / slowest run / shortest hold. */
export function valueFor(table: ScoreTable, points: number): number {
  const { values } = table.bracket;
  const p = Math.max(0, Math.min(MAX_POINTS, Math.round(points)));
  const threshold = values[p];
  if (table.better === "lower") return threshold ?? firstDefined(values);
  // Blank rows sit below the chart's floor (plank under 48 pts) and negative reps can't happen.
  return Math.max(0, threshold ?? 0);
}

/** Points earned with no effort at all: 0 reps / 0:00 hold. A run always scores at least 0. */
export function floorPoints(table: ScoreTable): number {
  return table.better === "higher" ? scoreFor(table, 0) : 0;
}

/** Value change worth one point (1 rep, 4 s of mile, 5 s of plank), always positive. */
export function stepFor(table: ScoreTable): number {
  const { values } = table.bracket;
  const top = values[MAX_POINTS];
  const below = values[MAX_POINTS - 1];
  if (top === null || top === undefined || below === null || below === undefined) return 1;
  return Math.max(1, Math.abs(top - below));
}

/**
 * One step better (dir 1) or worse (dir -1). Reps move by one; times snap to the next chart row
 * so each press is exactly one point (a run at 8:38 goes to 8:36 or 8:44, not 8:34 / 8:42).
 */
export function nudge(table: ScoreTable, value: number, dir: 1 | -1): number {
  if (table.unit === "reps") return Math.max(0, value + dir);
  const points = scoreFor(table, value);
  const step = stepFor(table);
  const betterSign = table.better === "lower" ? -1 : 1;
  if (dir === 1) {
    if (points >= MAX_POINTS) return Math.max(0, value + betterSign * step);
    return valueFor(table, points + 1);
  }
  if (points <= floorPoints(table)) return Math.max(0, value - betterSign * step);
  return valueFor(table, points - 1);
}

/** Slider range in raw units. Values outside it are still valid input; they just pin the slider. */
export function sliderRange(table: ScoreTable): { min: number; max: number } {
  const { values } = table.bracket;
  const best = values[MAX_POINTS] ?? 0;
  if (table.better === "lower") return { min: best, max: firstDefined(values) };
  return { min: 0, max: best };
}

function firstDefined(values: (number | null)[]): number {
  const v = values.find((x) => x !== null && x !== undefined);
  if (v === null || v === undefined) throw new Error("chart has no values");
  return v;
}

/**
 * Split `needed` integer points across events with per-event [lo, hi] bounds, as evenly as
 * possible (water-filling). Leftover single points go to the earliest events in order.
 */
export function distribute(needed: number, bounds: { lo: number; hi: number }[]): number[] {
  const clampAt = (level: number) => bounds.map((b) => Math.max(b.lo, Math.min(b.hi, level)));
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  const lows = bounds.map((b) => b.lo);
  if (needed <= sum(lows)) return lows;
  const highs = bounds.map((b) => b.hi);
  if (needed >= sum(highs)) return highs;

  let level = MAX_POINTS;
  while (level > 0 && sum(clampAt(level)) > needed) level--;
  const points = clampAt(level);
  let left = needed - sum(points);
  for (let i = 0; i < points.length && left > 0; i++) {
    const b = bounds[i];
    if (b && points[i] === level && level < b.hi) {
      points[i] = level + 1;
      left--;
    }
  }
  return points;
}

export interface EventPlan {
  event: EventId;
  table: ScoreTable;
  locked: boolean;
  /** Locked: the user's value. Auto: the least effort that earns `points`. */
  value: number;
  points: number;
  /** Lowest points this event can score (chart floor). */
  floor: number;
}

/**
 * calculator: everything locked, it's just a score.
 * balanced:   auto events share the remaining points and the average meets the requirement.
 * covered:    locked events already carry it; auto events sit at their chart floor.
 * impossible: even 100 in every auto event falls short.
 */
export type PlanStatus = "calculator" | "balanced" | "covered" | "impossible";

export interface Plan {
  events: Record<EventId, EventPlan>;
  required: number;
  requiredTotal: number;
  totalPoints: number;
  average: number;
  outcome: Outcome;
  status: PlanStatus;
  autoCount: number;
  /** Points the auto events had to cover after the locked ones. */
  autoNeeded: number;
}

export function solve(profile: Profile, locked: LockedValues): Plan {
  const required = rankById(profile.rank).required;
  const requiredTotal = required * EVENT_IDS.length;

  const tables = Object.fromEntries(EVENT_IDS.map((id) => [id, tableFor(id, profile)])) as Record<
    EventId,
    ScoreTable
  >;

  const autoIds = EVENT_IDS.filter((id) => locked[id] === null);
  let lockedPoints = 0;
  for (const id of EVENT_IDS) {
    const v = locked[id];
    if (v !== null) lockedPoints += scoreFor(tables[id], v);
  }

  const autoNeeded = requiredTotal - lockedPoints;
  const bounds = autoIds.map((id) => ({ lo: floorPoints(tables[id]), hi: MAX_POINTS }));
  const autoPoints = distribute(autoNeeded, bounds);

  const events = {} as Record<EventId, EventPlan>;
  for (const id of EVENT_IDS) {
    const table = tables[id];
    const floor = floorPoints(table);
    const v = locked[id];
    if (v !== null) {
      events[id] = { event: id, table, locked: true, value: v, points: scoreFor(table, v), floor };
    } else {
      const points = autoPoints[autoIds.indexOf(id)] ?? floor;
      events[id] = { event: id, table, locked: false, value: valueFor(table, points), points, floor };
    }
  }

  const totalPoints = EVENT_IDS.reduce((sum, id) => sum + events[id].points, 0);
  const average = totalPoints / EVENT_IDS.length;

  let status: PlanStatus;
  if (autoIds.length === 0) status = "calculator";
  else if (autoNeeded > bounds.length * MAX_POINTS) status = "impossible";
  else if (autoNeeded <= bounds.reduce((s, b) => s + b.lo, 0)) status = "covered";
  else status = "balanced";

  return {
    events,
    required,
    requiredTotal,
    totalPoints,
    average,
    outcome: outcomeFor(average, required),
    status,
    autoCount: autoIds.length,
    autoNeeded,
  };
}

export interface ImpossibleFix {
  /** The locked event costing the most (lowest score). */
  event: EventId;
  /** Points between the best reachable total and the required total. */
  shortBy: number;
  costPoints: number;
  /** Points / raw value that event needs for a full pass (with every Auto event at 100), or null if even 100 can't do it. */
  targetPoints: number | null;
  targetValue: number | null;
}

/** For an impossible plan: the smallest change to the weakest locked event that makes a pass reachable again. */
export function impossibleFix(plan: Plan): ImpossibleFix | null {
  if (plan.status !== "impossible") return null;
  const weak = weakestLocked(plan);
  if (!weak) return null;
  const shortBy = plan.requiredTotal - plan.totalPoints;
  const target = weak.points + shortBy;
  const reachable = target <= MAX_POINTS;
  return {
    event: weak.event,
    shortBy,
    costPoints: weak.points,
    targetPoints: reachable ? target : null,
    targetValue: reachable ? valueFor(weak.table, target) : null,
  };
}

export interface PassOption {
  event: EventId;
  /** Points / raw value that event needs on its own for a full pass. */
  targetPoints: number;
  targetValue: number;
}

/**
 * All four locked and short of the requirement: for each event, the value that would close the gap by
 * itself (events that would need more than 100 are left out).
 */
export function passOptions(plan: Plan): PassOption[] {
  if (plan.status !== "calculator") return [];
  const short = plan.requiredTotal - plan.totalPoints;
  if (short <= 0) return [];
  return EVENT_IDS.flatMap((event) => {
    const e = plan.events[event];
    const targetPoints = e.points + short;
    return targetPoints > MAX_POINTS ? [] : [{ event, targetPoints, targetValue: valueFor(e.table, targetPoints) }];
  });
}

/** The locked event that is furthest below the required average (for "what's costing you" copy). */
export function weakestLocked(plan: Plan): EventPlan | null {
  let worst: EventPlan | null = null;
  for (const id of EVENT_IDS) {
    const e = plan.events[id];
    if (e.locked && (worst === null || e.points < worst.points)) worst = e;
  }
  return worst;
}
