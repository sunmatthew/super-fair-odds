import React, { useCallback, useEffect } from 'react';
import { Insets, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DISABLED_OPACITY, PRESS_SCALE, springs, timings } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticStyle = 'none' | 'soft' | 'light';

interface PressableScaleProps {
  onPress?: () => void;
  disabled?: boolean;
  /** How far to scale down while held. Defaults to the shared press scale. */
  scaleTo?: number;
  /** Feedback fired on press-in, so it lands with the finger. */
  haptic?: HapticStyle;
  style?: StyleProp<ViewStyle>;
  /**
   * Extends the touch target past the visual bounds. Anything whose drawn
   * size is under 44pt should pass this rather than grow — Apple's minimum is
   * about the finger, not the ink.
   */
  hitSlop?: number | Insets;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'tab' | 'radio';
  accessibilityState?: { selected?: boolean; disabled?: boolean };
}

const IMPACT: Record<Exclude<HapticStyle, 'none'>, Haptics.ImpactFeedbackStyle> = {
  soft: Haptics.ImpactFeedbackStyle.Soft,
  light: Haptics.ImpactFeedbackStyle.Light,
};

/**
 * The single touch-feedback primitive for the app: a spring scale-down plus an
 * optional light impact. Everything tappable that isn't the coin uses this so
 * press feel stays identical across screens.
 */
export function PressableScale({
  onPress,
  disabled = false,
  scaleTo = PRESS_SCALE,
  haptic = 'none',
  style,
  hitSlop,
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  // Disabled is a state the user watches change — a button goes dim the
  // instant a flip starts and bright again when it settles. Snapping between
  // the two reads as a glitch, so it fades. Mount is not a transition, hence
  // the initial value rather than an animation from 1.
  const dim = useSharedValue(disabled ? DISABLED_OPACITY : 1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    dim.value = withTiming(disabled ? DISABLED_OPACITY : 1, timings.fast);
  }, [disabled, dim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim.value,
  }));

  const handlePressIn = useCallback(() => {
    // The haptic is the feedback that matters; under reduced motion it carries
    // the press on its own without any movement.
    if (!reduceMotion) {
      scale.value = withSpring(scaleTo, springs.press);
    }
    if (haptic !== 'none') {
      Haptics.impactAsync(IMPACT[haptic]);
    }
  }, [haptic, reduceMotion, scale, scaleTo]);

  const handlePressOut = useCallback(() => {
    if (!reduceMotion) {
      scale.value = withSpring(1, springs.press);
    }
  }, [reduceMotion, scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      style={[style, animatedStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
    >
      {children}
    </AnimatedPressable>
  );
}
