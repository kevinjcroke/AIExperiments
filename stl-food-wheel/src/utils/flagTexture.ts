import * as THREE from "three";
import { flagUrl } from "./flagUrls";

/**
 * flag-icons 4x3 SVG → cached CanvasTexture (rounded corners baked into alpha).
 *
 * `getFlagTexture` returns synchronously with a neutral placeholder; once the SVG
 * loads it is rasterised into the same canvas and `needsUpdate` is set.
 * Textures are cached per ISO code for the lifetime of the app — callers must not
 * dispose them (use `disposeFlagTextures` only for full teardown).
 *
 * Only the flags actually requested are fetched (each flag is its own emitted asset).
 */
const W = 256;
const H = 192;
const RADIUS = 22;

const cache = new Map<string, THREE.CanvasTexture>();

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlaceholder(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  roundedRect(ctx, 0, 0, W, H, RADIUS);
  ctx.fillStyle = "#e2e8f0";
  ctx.fill();
}

function drawFlag(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  roundedRect(ctx, 0, 0, W, H, RADIUS);
  ctx.clip();
  ctx.drawImage(img, 0, 0, W, H);
  // Subtle top sheen + inner edge so light flags still read against light wedges.
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, "rgba(255,255,255,0.18)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  roundedRect(ctx, 2, 2, W - 4, H - 4, RADIUS - 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(15,23,42,0.35)";
  ctx.stroke();
}

async function load(isoCode: string, canvas: HTMLCanvasElement, tex: THREE.CanvasTexture) {
  const url = flagUrl(isoCode);
  if (!url) {
    console.warn(`[flagTexture] no flag for ISO code "${isoCode}"`);
    return;
  }
  let blobUrl: string | null = null;
  try {
    // flag-icons SVGs only carry a viewBox; without explicit width/height some
    // browsers rasterise them at 300x150 (letterboxed) or refuse to draw them.
    const svg = await (await fetch(url)).text();
    const sized = svg.replace(/<svg\b/, `<svg width="${W * 2}" height="${H * 2}" preserveAspectRatio="none"`);
    blobUrl = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
    const img = new Image();
    img.decoding = "async";
    img.src = blobUrl;
    await img.decode();
    const ctx = canvas.getContext("2d");
    if (!ctx || cache.get(isoCode) !== tex) return; // disposed meanwhile
    drawFlag(ctx, img);
    tex.needsUpdate = true;
  } catch (err) {
    console.warn(`[flagTexture] failed to load flag "${isoCode}"`, err);
  } finally {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }
}

export function getFlagTexture(isoCode: string): THREE.CanvasTexture {
  const key = isoCode.toLowerCase();
  let tex = cache.get(key);
  if (!tex) {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (ctx) drawPlaceholder(ctx);
    tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    cache.set(key, tex);
    void load(key, canvas, tex);
  }
  return tex;
}

export function disposeFlagTextures(): void {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
