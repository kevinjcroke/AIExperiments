import type { WheelDataset } from "../types/wheel";
// Verified dataset (see data-report.md). Swap to ./fixture.json for offline UI work.
import raw from "./restaurants.json";

export const dataset: WheelDataset = raw as WheelDataset;
