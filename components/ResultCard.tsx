import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, springs, timings, typography } from '../theme';

interface ResultCardProps {
  /** Small label above the headline, e.g. "total". */
  overline?: string;
  /** The headline. Empty string renders the card in its resting state. */
  title: string;
  subtitle?: string;
  /**
   * `numeric` swaps in the oversized number style for totals and picks.
   * `detail` lays the card out as a row, for results that carry an emblem
   * and a qualifier alongside the name.
   */
  variant?: 'default' | 'numeric' | 'detail';
  /** `detail` only: emblem shown before the text. */
  leading?: React.ReactNode;
  /** `detail` only: badge shown after the text. */
  trailing?: React.ReactNode;
  /** Changing this re-plays the entrance animation. */
  animationKey?: string | number;
}

/**
 * A quiet container for an outcome. It is deliberately low-contrast so it
 * never competes with the hero object above it.
 */
export function ResultCard({
  overline,
  title,
  subtitle,
  variant = 'default',
  leading,
  trailing,
  animationKey,
}: ResultCardProps) {
  const opacity = useSharedValue(0);
  const lift = useSharedValue(8);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!title) {
      // Fade out in place, then reposition only once it is invisible.
      // Resetting the lift immediately made the text visibly jump mid-fade.
      opacity.value = withTiming(0, timings.fast, (finished) => {
        'worklet';
        if (finished) lift.value = 8;
      });
      return;
    }

    opacity.value = withTiming(1, timings.medium);
    // Reduced motion keeps the fade — which aids comprehension — and drops
    // only the movement.
    lift.value = reduceMotion ? 0 : withSpring(0, springs.snappy);
  }, [animationKey, title, opacity, lift, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: lift.value }],
  }));

  if (variant === 'detail') {
    return (
      <View
        style={[styles.card, styles.detailCard]}
        accessible
        accessibilityRole="text"
      >
        <Animated.View style={[styles.detailRow, animatedStyle]}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}

          <View style={styles.detailText}>
            <Text
              style={styles.detailTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title || ' '}
            </Text>
            {subtitle ? (
              <Text style={styles.detailSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          {trailing ?? null}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.card} accessible accessibilityRole="text">
      {/* NB: do not add `adjustsFontSizeToFit` here. Inside a ScrollView its
          measurement collapses the text to a few pixels, and `minimumFontScale`
          does not bound it. Long labels ellipsize instead. */}
      <Animated.View style={[styles.fill, animatedStyle]}>
        {overline ? <Text style={styles.overline}>{overline}</Text> : null}
        <Text
          style={variant === 'numeric' ? styles.numeric : styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title || ' '}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Animated.View>
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overline: {
    ...typography.overline,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.result,
    color: colors.primaryText,
    textAlign: 'center',
  },
  numeric: {
    ...typography.numeric,
    color: colors.primaryText,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },

  fill: {
    alignSelf: 'stretch',
  },
  detailCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'stretch',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    gap: 1,
  },
  detailTitle: {
    ...typography.label,
    fontSize: 19,
    color: colors.primaryText,
  },
  detailSubtitle: {
    ...typography.caption,
    fontSize: 15,
    color: colors.secondaryText,
  },
});
