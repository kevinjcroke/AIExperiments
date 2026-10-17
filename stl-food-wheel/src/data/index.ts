import type { WheelDataset } from "../types/wheel";
// Phase 1 fixture. Phase 3 swaps this import for ./restaurants.json.
import raw from "./fixture.json";

export const dataset: WheelDataset = raw as WheelDataset;
