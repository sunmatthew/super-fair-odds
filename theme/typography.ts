import { TextStyle } from 'react-native';

/**
 * System font throughout (SF on iOS). Sizes are unscaled base values —
 * Text scales them for Dynamic Type automatically, so avoid pairing these
 * with fixed container heights.
 */
export const typography = {
  /**
   * Home screen wordmark and tab titles.
   *
   * `textTransform` carries the lowercase house voice so the strings
   * themselves stay properly cased. That matters: VoiceOver reads the string,
   * not the rendered transform, so a hardcoded 'flip a coin' is announced
   * lowercase while 'Flip a Coin' is announced correctly and still *renders*
   * lowercase. Casing is styling; never bake it into content.
   */
  display: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1.4,
    textTransform: 'lowercase',
  } as TextStyle,

  /** Screen titles in the navigation header. Lowercase, like `display`. */
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '700',
    letterSpacing: -0.7,
    textTransform: 'lowercase',
  } as TextStyle,

  /** The headline of a result, e.g. "Heads". */
  result: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.6,
  } as TextStyle,

  /** Oversized numeric readouts, e.g. a dice total. */
  numeric: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    letterSpacing: -1.5,
  } as TextStyle,

  /** Activity card titles, button labels. */
  label: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,

  body: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.2,
  } as TextStyle,

  caption: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: -0.1,
  } as TextStyle,

  /** Small field labels above a readout, e.g. "total". Lowercase. */
  overline: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.1,
    textTransform: 'lowercase',
  } as TextStyle,
} as const;
