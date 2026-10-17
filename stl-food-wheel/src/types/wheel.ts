export type DiningStyle =
  | "Fast Casual"
  | "Casual Sit-Down"
  | "Upscale Sit-Down"
  | "Takeout / Counter";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export const DINING_STYLES: readonly DiningStyle[] = [
  "Fast Casual",
  "Casual Sit-Down",
  "Upscale Sit-Down",
  "Takeout / Counter",
];

export const PRICE_RANGES: readonly PriceRange[] = ["$", "$$", "$$$", "$$$$"];

export interface Restaurant {
  id: string; // slug, unique across the whole dataset, e.g. "balkan-treat-box"
  name: string;
  address: string; // full street address in the St. Louis metro
  neighborhood: string; // City neighborhood or county municipality
  lat: number;
  lng: number;
  diningStyle: DiningStyle;
  priceRange: PriceRange;
  recommendedDish: string; // signature dish + one-line note
  website?: string;
  sourceUrl: string; // URL used to verify the restaurant is currently operating
  lastVerified: string; // ISO date (YYYY-MM-DD) of that verification
}

export interface CountryNode {
  id: string; // slug, e.g. "bosnia"
  countryName: string; // "Bosnia & Herzegovina"
  shortName: string; // ≤ 12 chars for tight UI, e.g. "Bosnia"
  cuisineLabel: string; // "Bosnian"
  isoCode: string; // ISO 3166-1 alpha-2, lowercase, e.g. "ba" (used by flag-icons)
  restaurants: Restaurant[];
}

export interface WheelDataset {
  countries: CountryNode[];
}
