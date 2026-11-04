/** App state, saved to localStorage so the plan is still there next visit. */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  EVENT_IDS,
  MAX_AGE,
  MIN_AGE,
  NO_LOCKS,
  RANKS,
  type EventId,
  type LockedValues,
  type Profile,
} from "../lib/model";

export const STORAGE_KEY = "red-stripe-ready";

/** Upper bound for any typed value (seconds or reps) so junk input can't break the layout. */
export const MAX_VALUE = 60 * 60;

export interface PlannerState {
  profile: Profile | null;
  locked: LockedValues;
  setProfile: (profile: Profile) => void;
  /** Set a value; this locks the event. */
  setValue: (event: EventId, value: number) => void;
  unlock: (event: EventId) => void;
  unlockAll: () => void;
  reset: () => void;
}

export function clampValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_VALUE, Math.round(value)));
}

export function sanitizeProfile(p: unknown): Profile | null {
  if (!p || typeof p !== "object") return null;
  const { age, gender, rank } = p as Record<string, unknown>;
  if (typeof age !== "number" || !Number.isFinite(age)) return null;
  if (gender !== "male" && gender !== "female") return null;
  if (!RANKS.some((r) => r.id === rank)) return null;
  return {
    age: Math.max(MIN_AGE, Math.min(MAX_AGE, Math.round(age))),
    gender,
    rank: rank as Profile["rank"],
  };
}

export function sanitizeLocked(l: unknown): LockedValues {
  const out: LockedValues = { ...NO_LOCKS };
  if (!l || typeof l !== "object") return out;
  for (const id of EVENT_IDS) {
    const v = (l as Record<string, unknown>)[id];
    out[id] = typeof v === "number" && Number.isFinite(v) ? clampValue(v) : null;
  }
  return out;
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set) => ({
      profile: null,
      locked: { ...NO_LOCKS },
      setProfile: (profile) => set({ profile: sanitizeProfile(profile) }),
      setValue: (event, value) => set((s) => ({ locked: { ...s.locked, [event]: clampValue(value) } })),
      unlock: (event) => set((s) => ({ locked: { ...s.locked, [event]: null } })),
      unlockAll: () => set({ locked: { ...NO_LOCKS } }),
      reset: () => set({ profile: null, locked: { ...NO_LOCKS } }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ profile: s.profile, locked: s.locked }),
      // Never trust what's in storage: an old or hand-edited value falls back to defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        return { ...current, profile: sanitizeProfile(p.profile), locked: sanitizeLocked(p.locked) };
      },
    },
  ),
);
