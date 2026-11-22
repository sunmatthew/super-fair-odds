import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { DISC_INK, SATELLITE_OPACITY } from './types';
import { springs } from '../../theme';

interface DiscProps {
  value: number;
  size: number;
  color: string;
  /** Left/top of the disc within the cluster box. */
  left: number;
  top: number;
  /** Changing this re-rolls the disc's jitter; it ticks with the churn. */
  tick: number;
  agitating: boolean;
  isHero?: boolean;
  /** Staggers the settle so the cluster comes to rest in a ripple. */
  settleDelay?: number;
}

const jitter = (amp: number) => (Math.random() * 2 - 1) * amp;

/** Digits have to shrink or three-figure numbers overflow the disc. */
function fontFor(size: number, value: number): number {
  const digits = String(Math.abs(value)).length;
  const ratio = digits >= 4 ? 0.24 : digits === 3 ? 0.3 : digits === 2 ? 0.36 : 0.44;
  return Math.round(size * ratio);
}

/**
 * One token in the cluster. It owns its own jitter so the parent only has to
 * advance a tick — no shared arrays, no per-disc imperative handles.
 */
export function Disc({
  value,
  size,
  color,
  left,
  top,
  tick,
  agitating,
  isHero = false,
  settleDelay = 0,
}: DiscProps) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (agitating) {
      const amp = size * (isHero ? 0.035 : 0.07);
      offsetX.value = withSpring(jitter(amp), springs.press);
      offsetY.value = withSpring(jitter(amp), springs.press);
      scale.value = withSpring(
        isHero ? 1 + Math.random() * 0.04 : 0.93 + Math.random() * 0.11,
        springs.press
      );
      return;
    }

    offsetX.value = withDelay(settleDelay, withSpring(0, springs.snappy));
    offsetY.value = withDelay(settleDelay, withSpring(0, springs.snappy));
    scale.value = isHero
      ? // The hero lands with a little punch; the rest simply come to rest.
        withSequence(
          withSpring(1.1, springs.snappy),
          withSpring(1, springs.gentle)
        )
      : withDelay(settleDelay, withSpring(1, springs.snappy));
  }, [tick, agitating, isHero, settleDelay, size, offsetX, offsetY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.disc,
        {
          left,
          top,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: isHero ? 1 : SATELLITE_OPACITY,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
      // Every disc is decorative. Left visible to VoiceOver, the cluster
      // announced ten loose numbers before the control that owns them; the
      // result is spoken by HeroStage's label and by the result card.
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.inner}>
        <Text
          style={[styles.label, { fontSize: fontFor(size, value) }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {value}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disc: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1917',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: DISC_INK,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
});
