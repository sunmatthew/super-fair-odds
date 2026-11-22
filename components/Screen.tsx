import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Which safe-area edges this screen is responsible for padding. */
  edges?: { top?: boolean; bottom?: boolean };
  style?: StyleProp<ViewStyle>;
}

/**
 * Page background plus safe-area padding. Screens nested under the tab bar
 * opt out of `bottom` because the tab bar already reserves that space.
 */
export function Screen({
  children,
  edges = { top: true, bottom: true },
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: edges.top ? insets.top : 0,
          paddingBottom: edges.bottom ? Math.max(insets.bottom, spacing.md) : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
