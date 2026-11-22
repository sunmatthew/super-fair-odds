import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { PressableScale } from './PressableScale';
import { colors, radius, spacing, typography } from '../theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  /** Optional SF Symbol shown before the label. */
  symbol?: string;
  disabled?: boolean;
  accessibilityHint?: string;
}

/**
 * The quiet counterpart to PrimaryButton: a bordered pill that sits near a
 * primary action without competing with it.
 */
export function SecondaryButton({
  label,
  onPress,
  symbol,
  disabled = false,
  accessibilityHint,
}: SecondaryButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic="light"
      scaleTo={0.96}
      style={styles.button}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.content}>
        {symbol ? (
          <SymbolView
            name={symbol as never}
            size={15}
            tintColor={colors.primaryText}
            weight="semibold"
            fallback={<View />}
          />
        ) : null}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...typography.label,
    fontSize: 16,
    color: colors.primaryText,
  },
});
