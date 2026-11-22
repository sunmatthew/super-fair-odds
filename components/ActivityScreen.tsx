import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from './Screen';
import { NavigationHeader } from './NavigationHeader';
import { gutter, spacing } from '../theme';

interface ActivityScreenProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

/**
 * Shared chrome for every activity: header, gutters, and safe-area handling.
 * Activities supply only their own hero and controls.
 */
export function ActivityScreen({ title, onBack, children }: ActivityScreenProps) {
  return (
    <Screen>
      <NavigationHeader title={title} onBack={onBack} />
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: gutter,
    paddingBottom: spacing.xs,
  },
});
