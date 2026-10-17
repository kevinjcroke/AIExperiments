import { create } from "zustand";
import { useStore, type StoreApi, type UseBoundStore } from "zustand";
import type { CountryNode, DiningStyle, PriceRange, Restaurant, WheelDataset } from "../types/wheel";
import { dataset as defaultDataset } from "../data";

export interface Filters {
  diningStyles: DiningStyle[]; // empty = no filter
  priceRanges: PriceRange[]; // empty = no filter
}

export interface WheelState {
  dataset: WheelDataset;
  eliminatedIds: string[]; // persisted
  filters: Filters;
  muted: boolean; // persisted
  phase: "idle" | "spinning" | "settled";
  selectedId: string | null; // country shown in drawer
  pointerId: string | null; // country currently under the pointer (live readout)
  spinRequestId: number; // increments to request a spin

  // derived (selector, not stored): activeCountries — see selectActiveCountries
  requestSpin(): void; // no-op unless phase !== "spinning" and activeCountries.length > 0
  setPhase(p: WheelState["phase"]): void;
  setPointerId(id: string | null): void;
  select(id: string | null): void;
  eliminate(id: string): void; // eliminate/restore/reset are ignored while spinning
  restore(id: string): void;  //   (the wedge count must not change mid-spin)
  resetEliminated(): void;
  setFilters(f: Partial<Filters>): void; // ignored while spinning
  toggleMute(): void;
}

export const STORAGE_KEYS = {
  eliminated: "stl-food-wheel:v1:eliminated",
  muted: "stl-food-wheel:v1:muted",
} as const;

/** Minimal Storage subset so tests can inject an in-memory implementation. */
export type KVStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): KVStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readJSON(storage: KVStorage | null, key: string): unknown {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

function writeJSON(storage: KVStorage | null, key: string, value: unknown) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded / private mode — persistence is best effort.
  }
}

// ---------- derived data ----------

export function restaurantMatches(r: Restaurant, f: Filters): boolean {
  const styleOk = f.diningStyles.length === 0 || f.diningStyles.includes(r.diningStyle);
  const priceOk = f.priceRanges.length === 0 || f.priceRanges.includes(r.priceRange);
  return styleOk && priceOk;
}

export function matchingRestaurants(c: CountryNode, f: Filters): Restaurant[] {
  return c.restaurants.filter((r) => restaurantMatches(r, f));
}

export function computeActiveCountries(
  dataset: WheelDataset,
  eliminatedIds: readonly string[],
  filters: Filters,
): CountryNode[] {
  const eliminated = new Set(eliminatedIds);
  return dataset.countries.filter(
    (c) => !eliminated.has(c.id) && c.restaurants.some((r) => restaurantMatches(r, filters)),
  );
}

// Memoised on input identity so components can subscribe without re-rendering
// on every store change (zustand v5 compares selector output with Object.is).
let memo: { d: WheelDataset; e: string[]; f: Filters; out: CountryNode[] } | null = null;
export function selectActiveCountries(s: Pick<WheelState, "dataset" | "eliminatedIds" | "filters">): CountryNode[] {
  if (memo && memo.d === s.dataset && memo.e === s.eliminatedIds && memo.f === s.filters) return memo.out;
  const out = computeActiveCountries(s.dataset, s.eliminatedIds, s.filters);
  memo = { d: s.dataset, e: s.eliminatedIds, f: s.filters, out };
  return out;
}

export function countryById(dataset: WheelDataset, id: string | null): CountryNode | undefined {
  return id == null ? undefined : dataset.countries.find((c) => c.id === id);
}

// ---------- store ----------

export function createWheelStore(
  dataset: WheelDataset,
  storage: KVStorage | null = defaultStorage(),
): UseBoundStore<StoreApi<WheelState>> {
  const knownIds = new Set(dataset.countries.map((c) => c.id));
  const storedElim = readJSON(storage, STORAGE_KEYS.eliminated);
  const eliminatedIds = Array.isArray(storedElim)
    ? [...new Set(storedElim.filter((x): x is string => typeof x === "string" && knownIds.has(x)))]
    : [];
  const muted = readJSON(storage, STORAGE_KEYS.muted) === true;

  return create<WheelState>()((set, get) => {
    /** Clears selection/pointer if they fell off the wheel after a filter/elimination change. */
    const reconcile = (partial: Partial<WheelState>): Partial<WheelState> => {
      const next = { ...get(), ...partial };
      const activeIds = new Set(computeActiveCountries(next.dataset, next.eliminatedIds, next.filters).map((c) => c.id));
      const out = { ...partial };
      if (next.selectedId != null && !activeIds.has(next.selectedId)) out.selectedId = null;
      if (next.pointerId != null && !activeIds.has(next.pointerId)) out.pointerId = null;
      return out;
    };

    return {
      dataset,
      eliminatedIds,
      filters: { diningStyles: [], priceRanges: [] },
      muted,
      phase: "idle",
      selectedId: null,
      pointerId: null,
      spinRequestId: 0,

      requestSpin() {
        const s = get();
        if (s.phase === "spinning" || selectActiveCountries(s).length === 0) return;
        // Phase flips immediately so a second request in the same tick is a no-op.
        // The drawer closes while the wheel spins; WheelScene sets "settled" + select(winner).
        set({ phase: "spinning", selectedId: null, spinRequestId: s.spinRequestId + 1 });
      },

      setPhase(phase) {
        set({ phase });
      },

      setPointerId(pointerId) {
        if (get().pointerId !== pointerId) set({ pointerId });
      },

      select(id) {
        if (id != null && !selectActiveCountries(get()).some((c) => c.id === id)) return;
        set({ selectedId: id });
      },

      eliminate(id) {
        const s = get();
        if (s.phase === "spinning" || !knownIds.has(id) || s.eliminatedIds.includes(id)) return;
        const next = [...s.eliminatedIds, id];
        writeJSON(storage, STORAGE_KEYS.eliminated, next);
        set(reconcile({ eliminatedIds: next }));
      },

      restore(id) {
        const s = get();
        if (s.phase === "spinning" || !s.eliminatedIds.includes(id)) return;
        const next = s.eliminatedIds.filter((x) => x !== id);
        writeJSON(storage, STORAGE_KEYS.eliminated, next);
        set({ eliminatedIds: next });
      },

      resetEliminated() {
        const s = get();
        if (s.phase === "spinning" || s.eliminatedIds.length === 0) return;
        writeJSON(storage, STORAGE_KEYS.eliminated, []);
        set({ eliminatedIds: [] });
      },

      setFilters(f) {
        const s = get();
        if (s.phase === "spinning") return;
        set(reconcile({ filters: { ...s.filters, ...f } }));
      },

      toggleMute() {
        const muted = !get().muted;
        writeJSON(storage, STORAGE_KEYS.muted, muted);
        set({ muted });
      },
    };
  });
}

export const useWheelStore = createWheelStore(defaultDataset);

/** Stable (memoised) list of countries currently on the wheel, in dataset order. */
export function useActiveCountries(): CountryNode[] {
  return useStore(useWheelStore, selectActiveCountries);
}
