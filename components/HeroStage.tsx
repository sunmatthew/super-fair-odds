import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { HERO_PRESS_SCALE, springs } from '../theme';

/** Upward toss: far enough and fast enough to read as intent, not a scroll. */
const SWIPE_DISTANCE = -40;
const SWIPE_VELOCITY = -200;
/** Any-direction flick, for objects you'd spin rather than throw. */
const FLICK_VELOCITY = 420;

interface HeroStageProps {
  onActivate: () => void;
  /**
   * `up` — flick upward, for something you toss (coin, dice, card).
   * `any` — flick in any direction, for something you spin or shake.
   */
  flick?: 'up' | 'any';
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  accessibilityHint: string;
  onLayout?: React.ComponentProps<typeof Animated.View>['onLayout'];
}

/**
 * The interactive surface around an activity's hero object.
 *
 * Two jobs. First, it answers the finger *immediately*: the object dips on
 * touch-down rather than waiting for the tap to complete, so the screen feels
 * like it is listening. Every hero previously only reacted on release, which
 * read as lag on the slower activities.
 *
 * Second, it owns tap-or-flick composition, which was duplicated almost
 * identically across all five activity screens — and drifting between them.
 */
export function HeroStage({
  onActivate,
  flick = 'up',
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
  onLayout,
}: HeroStageProps) {
  const scale = useSharedValue(1);
  // A shared value, not a ref: the pan handler reads it on the UI thread.
  const fired = useSharedValue(false);
  const reduceMotion = useReducedMotion();

  const gesture = useMemo(() => {
    // These callbacks are worklets, so the dip lands on the UI thread the
    // moment the finger touches down. Under `runOnJS(true)` the whole gesture
    // hopped to the JS thread first, which is exactly the thread busy
    // computing an outcome — the feedback this component exists to give
    // arrived late precisely when it mattered most. Only `onActivate` crosses
    // back, because the outcome is React state.
    const press = () => {
      'worklet';
      if (reduceMotion) return;
      scale.value = withSpring(HERO_PRESS_SCALE, springs.press);
    };

    const release = () => {
      'worklet';
      if (reduceMotion) return;
      scale.value = withSpring(1, springs.press);
    };

    const tap = Gesture.Tap()
      .onBegin(press)
      .onEnd(() => {
        'worklet';
        runOnJS(onActivate)();
      })
      .onFinalize(release);

    const swipe = Gesture.Pan()
      .onBegin(() => {
        'worklet';
        fired.value = false;
        press();
      })
      .onUpdate((e) => {
        'worklet';
        if (fired.value) return;
        // Hypotenuse by hand rather than Math.hypot: keep the worklet to
        // arithmetic that is unambiguously available on the UI runtime.
        const speed = Math.sqrt(
          e.velocityX * e.velocityX + e.velocityY * e.velocityY
        );
        const triggered =
          flick === 'any'
            ? speed > FLICK_VELOCITY
            : e.translationY < SWIPE_DISTANCE && e.velocityY < SWIPE_VELOCITY;
        if (triggered) {
          fired.value = true;
          runOnJS(onActivate)();
        }
      })
      .onFinalize(release);

    // Race, so a quick tap wins before the pan can ever activate.
    return Gesture.Race(swipe, tap);
  }, [fired, flick, onActivate, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.stage, style, animatedStyle]}
        onLayout={onLayout}
        // Without `accessible`, the role and label below are set on a view
        // VoiceOver never stops at, and the hero's own children are read
        // loose instead. The object is one button.
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
