import * as THREE from "three";
import { FLAPPER_LEN, WEDGE_BEVEL_S, WEDGE_BEVEL_T, WEDGE_DEPTH, WEDGE_GAP, WHEEL_R } from "./constants";

/**
 * One wedge of an n-wheel, centred on +X (half-angle π/n), extruded towards +Z with a
 * bevel. The outline is inset by the bevel size (+ half the seam gap) so neighbouring
 * wedges never overlap (no z-fighting). All wedges of a wheel share this geometry; each
 * mesh is rotated to its bisector. Back face at z = 0.
 */
export function createWedgeGeometry(n: number): THREE.ExtrudeGeometry {
  const d = WEDGE_BEVEL_S + WEDGE_GAP / 2;
  const shape = new THREE.Shape();
  if (n <= 1) {
    shape.absarc(0, 0, WHEEL_R - WEDGE_BEVEL_S, 0, Math.PI * 2, false);
  } else {
    const h = Math.PI / n;
    const ro = WHEEL_R - WEDGE_BEVEL_S;
    // Apex: intersection of both inset edges on the bisector.
    const apex = d / Math.sin(h);
    const edgeA = h - Math.asin(Math.min(1, d / ro));
    shape.moveTo(apex, 0);
    shape.lineTo(ro * Math.cos(-edgeA), ro * Math.sin(-edgeA));
    shape.absarc(0, 0, ro, -edgeA, edgeA, false);
    shape.lineTo(apex, 0);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: WEDGE_DEPTH,
    bevelEnabled: true,
    bevelThickness: WEDGE_BEVEL_T,
    bevelSize: WEDGE_BEVEL_S,
    bevelSegments: 4,
    curveSegments: Math.max(6, Math.ceil(120 / Math.max(n, 1))),
  });
  geo.translate(0, 0, WEDGE_BEVEL_T);
  geo.computeVertexNormals();
  return geo;
}

/** Pointer flapper: rounded head around the pivot (origin) tapering to a tip at -Y. */
export function createFlapperGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  const head = 0.15;
  s.moveTo(-head, 0);
  s.absarc(0, 0, head, Math.PI, 0, true);
  s.lineTo(0.03, -FLAPPER_LEN + 0.03);
  s.quadraticCurveTo(0, -FLAPPER_LEN - 0.01, -0.03, -FLAPPER_LEN + 0.03);
  s.lineTo(-head, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.translate(0, 0, -0.05);
  return geo;
}

/** Soft radial glow texture for the backdrop. */
export function createGlowTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(99,102,241,0.55)");
    g.addColorStop(0.35, "rgba(56,189,248,0.18)");
    g.addColorStop(0.7, "rgba(15,23,42,0.05)");
    g.addColorStop(1, "rgba(2,6,23,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
