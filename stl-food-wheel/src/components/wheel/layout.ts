import { FRONT_Z, HUB_R, WHEEL_R, CAMERA_FOV, CONTENT_BOTTOM, CONTENT_HALF_W, CONTENT_TOP } from "./constants";

/** Width of a wedge (chord across it) at radius r, capped for very wide wedges. */
export function wedgeWidthAt(r: number, n: number): number {
  const half = Math.PI / Math.max(n, 1);
  return 2 * r * Math.sin(Math.min(half, Math.PI / 2));
}

export interface FlagLayout {
  /** Radial position of the flag centre along the bisector. */
  r: number;
  /** Tangential width (flag is 4:3, so radial height = 0.75 · w). */
  w: number;
}

const FLAG_OUTER_MARGIN = 0.14;

export function flagLayout(n: number, desktop: boolean): FlagLayout {
  const maxW = desktop ? 0.42 : n <= 2 ? 0.9 : 0.78;
  const minW = 0.1;
  let w = maxW;
  for (let k = 0; k < 40; k++) {
    const h = 0.75 * w;
    const rIn = WHEEL_R - FLAG_OUTER_MARGIN - h;
    if (wedgeWidthAt(rIn, n) >= w * 1.18 || w <= minW) break;
    w *= 0.94;
  }
  w = Math.max(w, minW);
  return { r: WHEEL_R - FLAG_OUTER_MARGIN - (0.75 * w) / 2, w };
}

export interface TextLayout {
  /** Radius of the text's outer (right-anchored) end. */
  rEnd: number;
  fontSize: number;
  maxWidth: number;
  /** Innermost radius the text may reach (just outside the hub). */
  rMin: number;
}

export const FONT_MAX = 0.2;
export const FONT_MIN = 0.085;

/** Rough advance width of `text` in ems for a bold sans (troika default font is Roboto). */
export function estimateEm(text: string): number {
  let em = 0;
  for (const ch of text) {
    if (ch === " ") em += 0.26;
    else if (/[A-Z]/.test(ch)) em += ch === "M" || ch === "W" ? 0.86 : ch === "I" ? 0.3 : 0.66;
    else if (/[ilj.,'’]/.test(ch)) em += 0.27;
    else if (/[mw]/.test(ch)) em += 0.84;
    else em += 0.56;
  }
  return em;
}

/** Fit `label` radially between the hub and the flag; null → render flag-only. */
export function textLayout(label: string, n: number, flag: FlagLayout): TextLayout | null {
  const rEnd = flag.r - (0.75 * flag.w) / 2 - 0.07;
  const rMin = HUB_R + 0.1;
  const avail = rEnd - rMin;
  if (avail <= 0) return null;
  const em = estimateEm(label) * 1.08; // safety margin
  for (let fs = FONT_MAX; fs >= FONT_MIN - 1e-9; fs -= 0.005) {
    const len = em * fs;
    if (len > avail) continue;
    const rStart = rEnd - len;
    // Cap-height + descender ≈ 1.0 em must fit inside the wedge at the narrow (inner) end.
    if (fs * 1.0 <= wedgeWidthAt(rStart, n) * 0.78) return { rEnd, fontSize: fs, maxWidth: avail, rMin };
  }
  return null;
}

export const LABEL_Z = FRONT_Z + 0.004;

/**
 * Given a measured text width (world units, at scale 1), returns the scale that keeps the
 * label between the hub and the flag and inside the wedge; 0 means "render flag-only".
 */
export function fitMeasuredText(width: number, layout: TextLayout, n: number): number {
  const avail = layout.rEnd - layout.rMin;
  let s = width > avail ? avail / width : 1;
  for (let k = 0; k < 30; k++) {
    if (layout.fontSize * s < FONT_MIN - 1e-6) return 0;
    if (layout.fontSize * s <= wedgeWidthAt(layout.rEnd - width * s, n) * 0.8) return s;
    s *= 0.95;
  }
  return 0;
}

/** HUD chrome that overlaps the stage (readout pill on top, Spin button / sheet below), in px. */
export function stageInsets(width: number, height: number): { top: number; bottom: number } {
  const portrait = height > width;
  const top = Math.min(130, Math.max(56, height * (portrait ? 0.17 : 0.13)));
  const bottom = Math.min(130, Math.max(48, height * (portrait ? 0.15 : 0.12)));
  return { top, bottom };
}

/**
 * Camera distance + height so the whole wheel + pointer fit inside the part of the canvas
 * not covered by HUD chrome, for any aspect (375 px portrait through wide landscape).
 * The camera looks straight down -Z, so its y is the world y at the canvas centre.
 */
export function fitCamera(width: number, height: number): { distance: number; centerY: number } {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const { top, bottom } = stageInsets(w, h);
  const usable = Math.max(h - top - bottom, h * 0.5);
  const margin = 1.05;
  const contentCenter = (CONTENT_TOP + CONTENT_BOTTOM) / 2;
  const halfH = ((CONTENT_TOP - CONTENT_BOTTOM) / 2) * margin;
  const halfW = CONTENT_HALF_W * margin;
  const t = Math.tan((CAMERA_FOV * Math.PI) / 360);
  const dH = (halfH * (h / usable)) / t;
  const dW = halfW / (t * (w / h));
  const distance = Math.max(dH, dW) + FRONT_Z;
  // Shift so the content is centred in the usable band (top inset pushes it down).
  const worldPerPx = (2 * (distance - FRONT_Z) * t) / h;
  const centerY = contentCenter + ((top - bottom) / 2) * worldPerPx;
  return { distance, centerY };
}
