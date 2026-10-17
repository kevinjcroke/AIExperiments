/** Shared dimensions (world units) for the 3D wheel. Wheel lies in the XY plane, front faces +Z. */
export const WHEEL_R = 2; // outer radius of the wedge disc
export const HUB_R = 0.42;

// Wedge extrusion
export const WEDGE_DEPTH = 0.16;
export const WEDGE_BEVEL_T = 0.04; // bevel thickness (z)
export const WEDGE_BEVEL_S = 0.018; // bevel size (outline growth)
export const WEDGE_GAP = 0.006; // visible seam between neighbouring wedges
/** z of the flat front face of the wedges. */
export const FRONT_Z = WEDGE_DEPTH + WEDGE_BEVEL_T * 2;

// Rotating rim + pegs
export const RIM_R = WHEEL_R + 0.07;
export const RIM_TUBE = 0.11;
export const RIM_Z = 0.13;
export const PEG_R = 0.034;
export const PEG_RADIUS_POS = WHEEL_R + 0.07; // pegs sit on the rim
export const PEG_BASE_Z = 0.18;
export const PEG_TOP_Z = 0.42;

// Static marquee frame (does not rotate)
export const MARQUEE_R = WHEEL_R + 0.36;
export const MARQUEE_TUBE = 0.075;
export const BULB_COUNT = 36;

// Pointer / flapper at 12 o'clock
export const FLAPPER_PIVOT_Y = WHEEL_R + 0.4;
export const FLAPPER_LEN = 0.46; // pivot → tip
export const FLAPPER_Z = 0.47;

/** Vertical extent of everything that must stay in frame. */
export const CONTENT_TOP = FLAPPER_PIVOT_Y + 0.2;
export const CONTENT_BOTTOM = -(MARQUEE_R + MARQUEE_TUBE);
export const CONTENT_HALF_W = MARQUEE_R + MARQUEE_TUBE;

export const CAMERA_FOV = 35;
