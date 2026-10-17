import { z } from "zod";
import type { WheelDataset } from "../types/wheel";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase slug");

export const diningStyleSchema = z.enum([
  "Fast Casual",
  "Casual Sit-Down",
  "Upscale Sit-Down",
  "Takeout / Counter",
]);

export const priceRangeSchema = z.enum(["$", "$$", "$$$", "$$$$"]);

export const restaurantSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    address: z.string().min(1),
    neighborhood: z.string().min(1),
    // Rough St. Louis metro bounding box — catches swapped or guessed coordinates.
    lat: z.number().min(38.3).max(39.0),
    lng: z.number().min(-90.9).max(-89.8),
    diningStyle: diningStyleSchema,
    priceRange: priceRangeSchema,
    recommendedDish: z.string().min(1),
    website: z.url().optional(),
    sourceUrl: z.url(),
    lastVerified: z.iso.date(),
  })
  .strict();

export const countryNodeSchema = z
  .object({
    id: slug,
    countryName: z.string().min(1),
    shortName: z.string().min(1).max(12),
    cuisineLabel: z.string().min(1),
    // ISO 3166-1 alpha-2, or a flag-icons subdivision code such as "gb-sct" (Scotland).
    isoCode: z.string().regex(/^[a-z]{2}(?:-[a-z]{3})?$/, "must be lowercase ISO 3166-1 alpha-2 or flag-icons subdivision"),
    restaurants: z.array(restaurantSchema),
  })
  .strict();

export const wheelDatasetSchema = z.object({ countries: z.array(countryNodeSchema) }).strict();

// Compile-time guarantee that the schema and the TS contract stay in lockstep.
type Inferred = z.infer<typeof wheelDatasetSchema>;
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const _schemaMatchesTypes: Equals<Inferred, WheelDataset> = true;
void _schemaMatchesTypes;
