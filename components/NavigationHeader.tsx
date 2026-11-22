import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { PressableScale } from './PressableScale';
import { colors, gutter, radius, shadows, spacing, typography } from '../theme';

interface NavigationHeaderProps {
  title: string;
  onBack?: () => void;
}

/**
 * Circular back affordance on the left with the title optically centered on
 * the screen, so titles of different lengths stay put.
 */
export function NavigationHeader({ title, onBack }: NavigationHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleLayer} pointerEvents="none">
        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {title}
        </Text>
      </View>

      {onBack ? (
        <PressableScale
          onPress={onBack}
          haptic="soft"
          scaleTo={0.9}
          // Drawn at 40pt; hit slop carries it past Apple's 44pt minimum
          // without making the circle visually heavier.
          hitSlop={8}
          style={styles.backButton}
          accessibilityLabel="Back"
          accessibilityHint="Returns to the home screen"
        >
          <SymbolView
            name="chevron.left"
            size={17}
            tintColor={colors.primaryText}
            weight="semibold"
            fallback={<Text style={styles.backFallback}>‹</Text>}
          />
        </PressableScale>
      ) : null}
    </View>
  );
}

const HEADER_HEIGHT = 56;

const styles = StyleSheet.create({
  header: {
    minHeight: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: gutter,
    paddingVertical: spacing.xs,
  },
  titleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 72,
  },
  title: {
    ...typography.title,
    color: colors.primaryText,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  backFallback: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.primaryText,
  },
});
