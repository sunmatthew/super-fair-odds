import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from './PressableScale';
import { colors, radius, spacing, timings, typography } from '../theme';

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

interface ChipRowProps<T extends string | number> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/**
 * A row of separate pills, as distinct from SegmentedControl's single sliding
 * track. Used where the options read as independent choices rather than two
 * halves of one switch.
 */
export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: ChipRowProps<T>) {
  return (
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => (
        <Chip
          key={String(option.value)}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

/**
 * Fill, border and label all cross-fade together. Snapping three colors at
 * once on press made the selection feel like a redraw rather than a move —
 * and it sat badly beside SegmentedControl, where the thumb glides.
 */
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, timings.medium);
  }, [progress, selected]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surface, colors.surfaceSunken]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border, colors.borderStrong]
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.secondaryText, colors.primaryText]
    ),
  }));

  return (
    <PressableScale
      onPress={onPress}
      // Re-tapping the active chip changes nothing, so it should not buzz.
      haptic={selected ? 'none' : 'light'}
      scaleTo={0.95}
      style={[styles.chip, chipStyle]}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    ...typography.label,
  },
});
