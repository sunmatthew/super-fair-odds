import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from './Screen';
import { colors, gutter, spacing, typography } from '../theme';
import { TAB_BAR_SPACE } from '../navigation/FloatingTabBar';

interface TabScreenProps {
  title: string;
  /** Optional control rendered opposite the title, e.g. a clear action. */
  action?: React.ReactNode;
  /**
   * Centered content suits an empty state; a list needs to start at the top.
   */
  centerContent?: boolean;
  children: React.ReactNode;
}

/** Title-plus-content layout shared by the secondary tabs. */
export function TabScreen({
  title,
  action,
  centerContent = true,
  children,
}: TabScreenProps) {
  return (
    <Screen edges={{ top: true, bottom: false }}>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {action}
        </View>
        <View style={centerContent ? styles.centered : styles.flow}>
          {children}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingTop: spacing.md,
    paddingBottom: TAB_BAR_SPACE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: gutter,
  },
  title: {
    ...typography.display,
    color: colors.primaryText,
    flexShrink: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gutter,
    paddingBottom: spacing.huge,
  },
  flow: {
    flex: 1,
  },
});
