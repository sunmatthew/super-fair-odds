import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import {
  colors,
  radius,
  shadows,
  spacing,
  springs,
  timings,
  typography,
} from '../theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

const TRACK_PADDING = 4;
const SEGMENT_HEIGHT = 44;

/**
 * The label's own color change, kept separate from the thumb.
 *
 * The thumb springs across the track; the text used to flip color on the same
 * frame the press landed. In slow motion you could see the two come apart —
 * the new segment read as selected before the thumb had arrived. Crossfading
 * the color over the thumb's travel keeps them one movement.
 *
 * This survives reduced motion on purpose: color carries meaning here, and
 * reduced motion means less movement, not less comprehension.
 */
function SegmentLabel({
  label,
  selected,
  disabled,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, timings.medium);
  }, [progress, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.secondaryText, colors.primaryText]
    ),
  }));

  return (
    <Animated.Text
      style={[styles.label, disabled ? styles.labelDisabled : animatedStyle]}
      numberOfLines={1}
    >
      {label}
    </Animated.Text>
  );
}

/**
 * A sliding-thumb segmented control. The thumb is a real animated view rather
 * than a background swap so the selection carries momentum.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbX = useSharedValue(0);
  const thumbOpacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const segmentWidth =
    trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;

  // -1 when `value` matches no option, which is a legitimate state: a caller
  // may drive this from something freeform (a typed range) that happens to
  // match none of the presets. The thumb hides rather than lying about it.
  const selectedIndex = options.findIndex((o) => o.value === value);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  // Driven by `value`, not by the press, so external changes move the thumb too.
  useEffect(() => {
    if (segmentWidth <= 0) return;

    if (selectedIndex < 0) {
      thumbOpacity.value = withTiming(0, timings.fast);
      return;
    }

    const target = selectedIndex * segmentWidth;
    if (thumbOpacity.value === 0 || reduceMotion) {
      thumbX.value = target; // appear in place rather than sliding in from 0
    } else {
      thumbX.value = withSpring(target, springs.snappy);
    }
    thumbOpacity.value = withTiming(1, timings.fast);
  }, [segmentWidth, selectedIndex, reduceMotion, thumbOpacity, thumbX]);

  const handlePress = useCallback(
    (option: SegmentOption<T>) => {
      if (option.disabled || option.value === value) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(option.value);
    },
    [onChange, value]
  );

  const thumbStyle = useAnimatedStyle(() => ({
    opacity: thumbOpacity.value,
    transform: [{ translateX: thumbX.value }],
  }));

  return (
    <View
      style={styles.track}
      onLayout={handleLayout}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.thumb, { width: segmentWidth }, thumbStyle]}
        />
      ) : null}

      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => handlePress(option)}
            disabled={option.disabled}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled: option.disabled }}
          >
            <SegmentLabel
              label={option.label}
              selected={selected}
              disabled={option.disabled}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    padding: TRACK_PADDING,
  },
  thumb: {
    position: 'absolute',
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    bottom: TRACK_PADDING,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    ...shadows.raised,
  },
  segment: {
    flex: 1,
    minHeight: SEGMENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.secondaryText,
  },
  labelDisabled: {
    color: colors.tertiaryText,
  },
});
