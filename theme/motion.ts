import { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

/**
 * Springs are the default for anything the user touches. Fast and settled,
 * never floaty. Timing is reserved for opacity and for the coin's own
 * choreography, which is tuned separately in the coin component.
 */
export const springs = {
  /** Press-in / press-out on cards and buttons. */
  press: { damping: 26, stiffness: 420, mass: 0.7 } as WithSpringConfig,
  /** Segmented control thumb, result card entrance. */
  snappy: { damping: 22, stiffness: 300, mass: 0.8 } as WithSpringConfig,
  /** Gentler settle for larger movements. */
  gentle: { damping: 20, stiffness: 180, mass: 0.9 } as WithSpringConfig,
} as const;

export const timings = {
  fast: { duration: 140 } as WithTimingConfig,
  medium: { duration: 220 } as WithTimingConfig,
} as const;

/** Scale applied to a pressable while the finger is down. */
export const PRESS_SCALE = 0.97;

/**
 * Opacity of a disabled pressable. Lives here rather than in each button so
 * the fade in and out of the disabled state is one value, animated in one
 * place (`PressableScale`).
 */
export const DISABLED_OPACITY = 0.4;

/**
 * Large objects need less scale than small controls to read as "pressed" —
 * the same 3% on a 190pt coin would look like a bounce.
 */
export const HERO_PRESS_SCALE = 0.98;

/**
 * Bezier control points, not `Easing` objects.
 *
 * Building `Easing.bezier(...)` at module scope crashes the worklet runtime at
 * startup (see CLAUDE.md), so these stay as plain arrays and each animation
 * spreads them at call time: `Easing.bezier(...EASING.out)`.
 *
 * Curves live here rather than in each feature so the five activities share one
 * motion vocabulary instead of five near-identical hand-tuned variants.
 */
export const EASING = {
  /** Entering, exiting, responding. The default for anything the user triggered. */
  out: [0.23, 1, 0.32, 1],
  /** Moving or morphing on screen, where both ends should ease. */
  inOut: [0.77, 0, 0.175, 1],
  /**
   * Accelerating fall. This is the one place an ease-in is correct: a dropping
   * object speeds up under gravity. Never use it for UI entrances.
   */
  gravity: [0.55, 0, 1, 0.45],
  /** Landing overshoot. */
  bounce: [0.34, 1.4, 0.64, 1],
  /** A touch more overshoot, for the coin's signature landing. */
  bounceStrong: [0.34, 1.56, 0.64, 1],
  /** Very long decay, for something spinning down under friction. */
  spinDown: [0.08, 0.62, 0.12, 1],
  /** Gentle settle after an overshoot. */
  settle: [0.33, 1, 0.68, 1],
} as const;
