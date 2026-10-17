import * as THREE from "three";

/**
 * Agent 2 implements: load flag-icons 4x3 SVG for `isoCode` into a cached CanvasTexture.
 * Returns synchronously; the texture fills in (needsUpdate) once the SVG has loaded.
 * Cached per ISO code for the lifetime of the app — do not dispose per wedge.
 */
const cache = new Map<string, THREE.CanvasTexture>();

export function getFlagTexture(isoCode: string): THREE.CanvasTexture {
  let tex = cache.get(isoCode);
  if (!tex) {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 3;
    tex = new THREE.CanvasTexture(canvas);
    cache.set(isoCode, tex);
  }
  return tex;
}

export function disposeFlagTextures(): void {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
