import { Platform, ViewStyle } from 'react-native';

/**
 * Elevation here exists to separate near-white surfaces from the warm
 * background — not to make things float. Keep every value low.
 */
const ios = (opacity: number, blur: number, y: number): ViewStyle => ({
  shadowColor: '#1A1917',
  shadowOpacity: opacity,
  shadowRadius: blur,
  shadowOffset: { width: 0, height: y },
});

export const shadows = {
  none: {} as ViewStyle,

  card: Platform.select({
    ios: ios(0.05, 14, 4),
    default: { elevation: 2 } as ViewStyle,
  })!,

  raised: Platform.select({
    ios: ios(0.07, 8, 2),
    default: { elevation: 3 } as ViewStyle,
  })!,

  button: Platform.select({
    ios: ios(0.1, 12, 4),
    default: { elevation: 4 } as ViewStyle,
  })!,
} as const;
