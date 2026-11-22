/**
 * Warm, paper-like palette. The background is deliberately off-white rather
 * than pure white so that white surfaces read as raised without heavy shadows.
 */

export const colors = {
  background: '#F5F3EF',
  surface: '#FDFCFA',
  surfaceSunken: '#EFECE6',

  primaryText: '#1A1917',
  secondaryText: '#8A867E',
  tertiaryText: '#A9A59D',

  border: '#E9E5DE',
  borderStrong: '#DDD8CF',

  ink: '#1A1917',
  onInk: '#FDFCFA',
} as const;

/**
 * Per-activity accents. `tint` colors the hero object, `soft` is for any
 * low-emphasis fill behind it, `onAccent` is legible text on top of `tint`.
 */
export const accents = {
  coin: { tint: '#DFAE3C', soft: '#F6EACB', onAccent: '#4A360A' },
  dice: { tint: '#A89E8B', soft: '#F0ECE2', onAccent: '#1A1917' },
  cards: { tint: '#C4453B', soft: '#F6E0DD', onAccent: '#FDFCFA' },
  wheel: { tint: '#C79A4E', soft: '#F2E8D8', onAccent: '#3A2C0E' },
  numbers: { tint: '#8FA3C9', soft: '#E6EAF3', onAccent: '#1B2740' },
} as const;

export type AccentName = keyof typeof accents;

/**
 * Shared pastel ring, used wherever an activity needs a sequence of distinct
 * but equally-weighted colors (wheel slices, number discs). Index into it with
 * modulo so any count works.
 */
export const pastels = [
  '#7E8FCB', // blue
  '#E88FA8', // pink
  '#E3C85A', // yellow
  '#A9C88A', // green
  '#E8954A', // orange
  '#B79BD4', // purple
  '#7FC4C0', // teal
  '#E8776E', // red
  '#C9CE72', // lime
  '#7FB8D8', // sky
  '#8FC7A8', // mint
  '#E8C255', // gold
] as const;

export function pastelAt(index: number): string {
  return pastels[((index % pastels.length) + pastels.length) % pastels.length];
}
