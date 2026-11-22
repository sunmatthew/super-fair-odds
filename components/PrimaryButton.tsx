import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from './PressableScale';
import {
  accents,
  AccentName,
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  /** `ink` is the default dark pill; `accent` tints it with the activity color. */
  tone?: 'ink' | 'accent';
  accent?: AccentName;
  disabled?: boolean;
  accessibilityHint?: string;
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'ink',
  accent = 'coin',
  disabled = false,
  accessibilityHint,
}: PrimaryButtonProps) {
  const palette = accents[accent];
  const background = tone === 'accent' ? palette.tint : colors.ink;
  const foreground = tone === 'accent' ? palette.onAccent : colors.onInk;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic="soft"
      scaleTo={0.975}
      style={[
        styles.button,
        { backgroundColor: background },
      ]}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: foreground }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    ...shadows.button,
  },
  content: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.label,
    fontSize: 18,
  },
});
