import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { colors, radius, spacing, typography } from '../theme';

interface EmptyStateProps {
  symbol: string;
  title: string;
  body: string;
}

/** Shared "nothing here yet" panel for screens without content. */
export function EmptyState({ symbol, title, body }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWell}>
        <SymbolView
          name={symbol as never}
          size={34}
          tintColor={colors.secondaryText}
          fallback={<View style={styles.iconFallback} />}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  iconWell: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  iconFallback: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryText,
  },
  title: {
    ...typography.label,
    fontSize: 19,
    color: colors.primaryText,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.secondaryText,
    textAlign: 'center',
    maxWidth: 300,
  },
});
