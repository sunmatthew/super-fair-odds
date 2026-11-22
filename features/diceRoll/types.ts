export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export type DiceCount = 1 | 2 | 3;

export const DICE_COUNTS: DiceCount[] = [1, 2, 3];

/**
 * Which face sits on each side of the cube. Opposite faces sum to seven, as on
 * a real die: 1/6 front-back, 3/4 right-left, 5/2 top-bottom.
 */
export const FACE_LAYOUT = {
  front: 1,
  back: 6,
  right: 3,
  left: 4,
  top: 5,
  bottom: 2,
} as const;

/**
 * Pip positions on a 3x3 grid, row-major. Index 0 is top-left, 8 bottom-right.
 */
export const PIP_GRID: Record<DieValue, boolean[]> = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
};

/**
 * Cube rotation (in degrees) that brings each value's face toward the viewer.
 * Derived from FACE_LAYOUT: to show a face, rotate its normal onto +Z.
 */
export const FACE_ORIENTATION: Record<DieValue, { x: number; y: number }> = {
  1: { x: 0, y: 0 },     // front
  2: { x: 90, y: 0 },    // bottom
  3: { x: 0, y: -90 },   // right
  4: { x: 0, y: 90 },    // left
  5: { x: -90, y: 0 },   // top
  6: { x: 0, y: 180 },   // back
};
