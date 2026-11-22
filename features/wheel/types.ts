export interface WheelOption {
  id: string;
  label: string;
}

import { pastels } from '../../theme';

/**
 * Segment colors, in wheel order. An option's color comes from its position,
 * so the dot beside it in the list always matches its slice.
 */
export const SEGMENT_COLORS = pastels;

export const WHEEL_GOLD = {
  rim: '#D9B25B',
  rimEdge: '#BE9235',
  rimInner: '#E7C878',
  hub: '#D2A54D',
  hubEdge: '#B58B33',
  pointer: '#D2A54D',
  pointerEdge: '#A8801F',
} as const;

/** A wheel needs at least two slices; past a dozen the slices stop reading. */
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = SEGMENT_COLORS.length;

export const MAX_LABEL_LENGTH = 24;

export function segmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

/** Seeded so a first-run wheel is immediately spinnable and self-explanatory. */
export function defaultOptions(): WheelOption[] {
  return ['Blue', 'Pink', 'Yellow', 'Green', 'Orange', 'Purple'].map(
    (label, i) => ({ id: `default-${i}`, label })
  );
}

let idCounter = 0;
export function newOptionId(): string {
  idCounter += 1;
  return `opt-${Date.now().toString(36)}-${idCounter}`;
}
