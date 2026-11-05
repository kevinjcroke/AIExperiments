/** Domain types and fixed rules from the school's physical-test email. */

export const EVENT_IDS = ["mile", "pushups", "squats", "plank"] as const;
export type EventId = (typeof EVENT_IDS)[number];

export type Gender = "male" | "female";

/**
 * What people see for the men's/women's choice. The app asks which chart someone is scored on,
 * not who they are; which chart a student tests on is the dojo's call.
 */
export const CHART_LABEL: Record<Gender, string> = { male: "Men's", female: "Women's" };

export const RANKS = [
  { id: "green-blue", label: "Green/Blue Belt", short: "Green/Blue", required: 65, belt: ["#2E9E4F", "#2F6BD8"] },
  { id: "blue", label: "Blue Belt", short: "Blue", required: 70, belt: ["#2F6BD8", "#2F6BD8"] },
  { id: "blue-brown", label: "Blue/Brown Belt", short: "Blue/Brown", required: 75, belt: ["#2F6BD8", "#7B4F2C"] },
  { id: "brown", label: "Brown Belt", short: "Brown", required: 80, belt: ["#7B4F2C", "#7B4F2C"] },
] as const;
export type RankId = (typeof RANKS)[number]["id"];
export type Rank = (typeof RANKS)[number];

export function rankById(id: RankId): Rank {
  return RANKS.find((r) => r.id === id) ?? RANKS[0];
}

/** Up to this many points below the requirement still earns the stripe (retest at the next rank). */
export const GRACE_POINTS = 5;

export const MIN_AGE = 13;
export const MAX_AGE = 99;

export interface Profile {
  age: number;
  gender: Gender;
  rank: RankId;
}

/** A locked event holds the user's raw value (seconds or reps); null means Auto (solved for). */
export type LockedValues = Record<EventId, number | null>;

export const NO_LOCKS: LockedValues = { mile: null, pushups: null, squats: null, plank: null };

export interface EventMeta {
  id: EventId;
  /** Position in the test, "01"-"04". */
  n: string;
  name: string;
  short: string;
  kind: "time" | "reps";
  /** Card subtitle, e.g. "Reps in 2 min · more is better". */
  sub: string;
  /** Singular noun for copy like "Add 3 push-ups"; times use m:ss instead. */
  one: string;
  /** Slider end labels; right is always the bigger number. */
  ends: [left: string, right: string];
}

export const EVENTS: Record<EventId, EventMeta> = {
  mile: { id: "mile", n: "01", name: "One-mile run", short: "Mile", kind: "time", sub: "m:ss · faster is better", one: "mile", ends: ["Faster", "Slower"] },
  pushups: { id: "pushups", n: "02", name: "Push-ups", short: "Push-ups", kind: "reps", sub: "Reps in 2 min · more is better", one: "push-up", ends: ["Fewer", "More"] },
  squats: { id: "squats", n: "03", name: "Squats", short: "Squats", kind: "reps", sub: "Reps in 2 min · more is better", one: "squat", ends: ["Fewer", "More"] },
  plank: { id: "plank", n: "04", name: "Plank", short: "Plank", kind: "time", sub: "Hold · m:ss · longer is better", one: "plank", ends: ["Shorter", "Longer"] },
};

export type Outcome = "pass" | "conditional" | "retest";

export function outcomeFor(average: number, required: number): Outcome {
  if (average >= required) return "pass";
  if (required - average <= GRACE_POINTS) return "conditional";
  return "retest";
}

export const OUTCOME_COPY: Record<Outcome, { label: string; detail: string }> = {
  pass: { label: "Pass", detail: "Your average meets the requirement. You earn your red stripe." },
  conditional: {
    label: "Conditional pass",
    detail: "Within 5 points: you get the stripe, but retest at your first stripe test at the next rank.",
  },
  retest: { label: "Retest in one month", detail: "More than 5 points short: you retake the physical test in a month." },
};
