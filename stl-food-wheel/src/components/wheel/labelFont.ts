import { useEffect, useState } from "react";
import fontUrl from "./fonts/Outfit-Bold.ttf?url";

/**
 * Wedge label font: Outfit Bold (SIL OFL 1.1, see fonts/Outfit-OFL.txt), bundled locally so
 * troika never fetches its default font from a CDN.
 */
export const LABEL_FONT_URL: string = fontUrl;
export const LABEL_LETTER_SPACING = 0.02; // em

type Measure = (text: string) => number;

let ready: Promise<Measure | null> | null = null;
let resolved: Measure | null = null;

/** Loads the same TTF into the DOM via FontFace and measures advance widths (in ems) with a 2D canvas. */
function loadMeasure(): Promise<Measure | null> {
  if (ready) return ready;
  ready = (async () => {
    try {
      if (typeof FontFace === "undefined" || typeof document === "undefined") return null;
      const face = new FontFace("WheelLabelOutfit", `url(${fontUrl})`, { weight: "700" });
      await face.load();
      document.fonts.add(face);
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return null;
      ctx.font = `700 100px WheelLabelOutfit`;
      const cache = new Map<string, number>();
      resolved = (text: string) => {
        let em = cache.get(text);
        if (em === undefined) {
          em = ctx.measureText(text).width / 100 + LABEL_LETTER_SPACING * Math.max(0, [...text].length - 1);
          cache.set(text, em);
        }
        return em;
      };
      return resolved;
    } catch {
      return null;
    }
  })();
  return ready;
}

/** Returns an em-width measurer once the label font has loaded (null until then → estimate). */
export function useLabelMeasure(): Measure | null {
  const [m, setM] = useState<Measure | null>(() => resolved);
  useEffect(() => {
    let alive = true;
    void loadMeasure().then((fn) => {
      if (alive && fn) setM(() => fn);
    });
    return () => {
      alive = false;
    };
  }, []);
  return m;
}
