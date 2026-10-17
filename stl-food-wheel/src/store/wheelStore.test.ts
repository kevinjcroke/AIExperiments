import { describe, expect, it } from "vitest";
import fixture from "../data/fixture.json";
import type { WheelDataset } from "../types/wheel";
import { STORAGE_KEYS, createWheelStore, selectActiveCountries, type KVStorage } from "./wheelStore";

const ds = fixture as WheelDataset;

function memStorage(init: Record<string, string> = {}): KVStorage & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) };
}

const ids = (s: ReturnType<ReturnType<typeof createWheelStore>["getState"]>) => selectActiveCountries(s).map((c) => c.id);

describe("wheelStore", () => {
  it("starts with all countries active, in dataset order", () => {
    const st = createWheelStore(ds, memStorage());
    expect(ids(st.getState())).toEqual(["bosnia", "ethiopia", "vietnam"]);
  });

  it("filters: OR within a group, AND across groups", () => {
    const st = createWheelStore(ds, memStorage());
    st.getState().setFilters({ priceRanges: ["$$$"] });
    expect(ids(st.getState())).toEqual(["vietnam"]);
    st.getState().setFilters({ priceRanges: ["$", "$$$"] });
    expect(ids(st.getState())).toEqual(["bosnia", "vietnam"]);
    // AND across groups must apply to the same restaurant
    st.getState().setFilters({ diningStyles: ["Casual Sit-Down"], priceRanges: ["$"] });
    expect(ids(st.getState())).toEqual([]);
  });

  it("clears selectedId when the selection is filtered or eliminated away", () => {
    const st = createWheelStore(ds, memStorage());
    st.getState().select("ethiopia");
    st.getState().setFilters({ priceRanges: ["$$$"] });
    expect(st.getState().selectedId).toBeNull();
    st.getState().setFilters({ priceRanges: [] });
    st.getState().select("bosnia");
    st.getState().eliminate("bosnia");
    expect(st.getState().selectedId).toBeNull();
  });

  it("requestSpin is a no-op while spinning or with 0 active countries", () => {
    const st = createWheelStore(ds, memStorage());
    st.getState().requestSpin();
    st.getState().requestSpin();
    expect(st.getState().spinRequestId).toBe(1);
    expect(st.getState().phase).toBe("spinning");
    st.getState().setFilters({ priceRanges: ["$$$$"] }); // ignored while spinning
    expect(st.getState().filters.priceRanges).toEqual([]);
    st.getState().setPhase("settled");
    st.getState().setFilters({ priceRanges: ["$$$$"] });
    st.getState().requestSpin();
    expect(st.getState().spinRequestId).toBe(1);
  });

  it("eliminate / restore / reset are ignored while spinning", () => {
    const st = createWheelStore(ds, memStorage());
    st.getState().eliminate("ethiopia");
    st.getState().requestSpin();
    st.getState().eliminate("bosnia");
    st.getState().restore("ethiopia");
    st.getState().resetEliminated();
    expect(st.getState().eliminatedIds).toEqual(["ethiopia"]);
    st.getState().setPhase("settled");
    st.getState().restore("ethiopia");
    expect(st.getState().eliminatedIds).toEqual([]);
  });

  it("persists eliminated + muted and drops unknown IDs on load", () => {
    const storage = memStorage({ [STORAGE_KEYS.eliminated]: JSON.stringify(["ethiopia", "atlantis", 3]) });
    const st = createWheelStore(ds, storage);
    expect(st.getState().eliminatedIds).toEqual(["ethiopia"]);
    st.getState().eliminate("vietnam");
    st.getState().toggleMute();
    const again = createWheelStore(ds, storage);
    expect(again.getState().eliminatedIds).toEqual(["ethiopia", "vietnam"]);
    expect(again.getState().muted).toBe(true);
    again.getState().restore("ethiopia");
    again.getState().resetEliminated();
    expect(createWheelStore(ds, storage).getState().eliminatedIds).toEqual([]);
  });

  it("survives corrupt or throwing storage", () => {
    const bad: KVStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    const st = createWheelStore(ds, bad);
    st.getState().eliminate("bosnia");
    expect(st.getState().eliminatedIds).toEqual(["bosnia"]);
    expect(createWheelStore(ds, memStorage({ [STORAGE_KEYS.eliminated]: "{not json" })).getState().eliminatedIds).toEqual([]);
  });

  it("activeCountries selector is referentially stable", () => {
    const st = createWheelStore(ds, memStorage());
    const a = selectActiveCountries(st.getState());
    st.getState().setPointerId("bosnia");
    expect(selectActiveCountries(st.getState())).toBe(a);
  });
});
