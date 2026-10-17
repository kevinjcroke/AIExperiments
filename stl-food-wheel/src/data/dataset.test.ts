import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import raw from "./restaurants.json";
import { wheelDatasetSchema } from "./schema";

const flagPath = (iso: string) =>
  fileURLToPath(new URL(`../../node_modules/flag-icons/flags/4x3/${iso}.svg`, import.meta.url));

describe("restaurants.json", () => {
  const parsed = wheelDatasetSchema.safeParse(raw);

  it("passes the zod schema", () => {
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2)).toBe(true);
  });

  const data = parsed.success ? parsed.data : { countries: [] };

  it("has at least one country", () => {
    expect(data.countries.length).toBeGreaterThan(0);
  });

  it("country IDs are unique", () => {
    const ids = data.countries.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("restaurant IDs are unique across the whole dataset", () => {
    const ids = data.countries.flatMap((c) => c.restaurants.map((r) => r.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every isoCode has a matching flag-icons SVG", () => {
    for (const c of data.countries) expect(existsSync(flagPath(c.isoCode)), `${c.id} → ${c.isoCode}`).toBe(true);
  });

  it("every country has at least one restaurant", () => {
    for (const c of data.countries) expect(c.restaurants.length, c.id).toBeGreaterThanOrEqual(1);
  });
});

describe("fixture.json", () => {
  it("passes the zod schema", async () => {
    const fixture = (await import("./fixture.json")).default;
    expect(wheelDatasetSchema.safeParse(fixture).success).toBe(true);
  });
});
