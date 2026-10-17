/**
 * flag-icons 4x3 SVG URLs keyed by ISO code. Eager URL strings only (tiny); each SVG is a
 * separate emitted asset fetched on demand. Shared by FlagIcon (DOM) and flagTexture (WebGL),
 * and replaces the 460 kB flag-icons stylesheet that referenced every flag.
 */
const byPath = import.meta.glob<string>("/node_modules/flag-icons/flags/4x3/*.svg", {
  query: "?url",
  import: "default",
  eager: true,
});

export const flagUrls: Record<string, string> = Object.fromEntries(
  Object.entries(byPath).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, -4), url]),
);

export const flagUrl = (isoCode: string): string | undefined => flagUrls[isoCode];
