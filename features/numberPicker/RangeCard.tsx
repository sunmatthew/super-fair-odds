import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

interface RangeCardProps {
  minText: string;
  maxText: string;
  onChangeMin: (text: string) => void;
  onChangeMax: (text: string) => void;
  /** Fired on blur; the owner parses, clamps and writes the values back. */
  onCommit: () => void;
  disabled?: boolean;
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onCommit: () => void;
  disabled: boolean;
}

function Field({ label, value, onChangeText, onCommit, disabled }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        onBlur={onCommit}
        onSubmitEditing={onCommit}
        keyboardType="number-pad"
        maxLength={4}
        editable={!disabled}
        returnKeyType="done"
        accessibilityLabel={label}
      />
    </View>
  );
}

export function RangeCard({
  minText,
  maxText,
  onChangeMin,
  onChangeMax,
  onCommit,
  disabled = false,
}: RangeCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Custom range</Text>

      <View style={styles.row}>
        <Field
          label="Min"
          value={minText}
          onChangeText={onChangeMin}
          onCommit={onCommit}
          disabled={disabled}
        />
        <Field
          label="Max"
          value={maxText}
          onChangeText={onChangeMax}
          onCommit={onCommit}
          disabled={disabled}
        />
      </View>

      <Text style={styles.helper}>Choose any range, then pick a number.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: {
    ...typography.label,
    fontSize: 20,
    color: colors.primaryText,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  field: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.secondaryText,
  },
  fieldInput: {
    // No typography spread: a token's lineHeight misaligns glyphs in a
    // TextInput on iOS. See CLAUDE.md.
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.primaryText,
    paddingVertical: spacing.xxs,
  },
  helper: {
    ...typography.caption,
    fontSize: 15,
    color: colors.secondaryText,
    marginTop: spacing.sm,
  },
});
