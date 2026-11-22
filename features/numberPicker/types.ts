export interface RangePreset {
  value: string;
  label: string;
  min: number;
  max: number;
}

export const RANGE_PRESETS: RangePreset[] = [
  { value: '10', label: '1–10', min: 1, max: 10 },
  { value: '50', label: '1–50', min: 1, max: 50 },
  { value: '100', label: '1–100', min: 1, max: 100 },
];

export const RANGE_LIMIT = 9999;
export const DEFAULT_MIN = 1;
export const DEFAULT_MAX = 10;

/**
 * Satellite anchors, in units of hero-disc diameters measured from the
 * cluster's center, so the whole arrangement scales with the hero and never
 * needs absolute coordinates.
 *
 * Six, not nine. The satellites are *context* — they say "sampled from a
 * range" — and nine of them at full strength made ten competing readouts on a
 * screen whose entire job is to show you one number.
 *
 * Ordered so that every prefix is balanced, not so that the ring reads in
 * order: a small range shows only the first few, and top-then-bottom-then-side
 * stays centered where going around the rim would pile them on one side.
 */
export const SATELLITE_ANCHORS: { x: number; y: number }[] = [
  { x: 0.22, y: -0.81 },  // top
  { x: -0.36, y: 0.78 },  // bottom
  { x: 0.84, y: -0.27 },  // upper right
  { x: -0.87, y: 0.12 },  // left
  { x: 0.55, y: 0.61 },   // lower right
  { x: -0.55, y: -0.61 }, // upper left
];

export const MAX_SATELLITES = SATELLITE_ANCHORS.length;

/** Satellite diameter as a fraction of the hero's. */
export const SATELLITE_RATIO = 0.46;

/**
 * Satellites render at this opacity — fill, ink and shadow together, since a
 * layer's opacity composites all three. It is the whole of the hierarchy: the
 * hero is simply the one disc at full strength, so it reads first without
 * needing a louder color than the pastels around it.
 */
export const SATELLITE_OPACITY = 0.55;

/** The hero reads as "the chosen one", so it sits apart from the pastel ring. */
export const HERO_COLOR = '#F4E7C1';
export const DISC_INK = '#26231D';

export function rangeSize(min: number, max: number): number {
  return Math.max(0, max - min + 1);
}
