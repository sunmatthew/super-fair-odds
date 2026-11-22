import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { PressableScale } from './PressableScale';
import { ActivityArt } from './ActivityArt';
import { Activity } from '../data/activities';
import { colors, radius, shadows, spacing, typography } from '../theme';

interface ActivityCardProps {
  activity: Activity;
  onPress: (activity: Activity) => void;
}

const ART_SIZE = 92;

/**
 * One card per activity. The hero object owns most of the card; the title and
 * chevron sit in a compact footer so the object stays the focal point.
 */
export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const handlePress = useCallback(() => onPress(activity), [activity, onPress]);

  return (
    <PressableScale
      style={styles.card}
      onPress={handlePress}
      haptic="soft"
      accessibilityLabel={activity.title}
      accessibilityHint={activity.blurb}
    >
      <View style={styles.artArea}>
        <ActivityArt art={activity.art} accent={activity.accent} size={ART_SIZE} />
      </View>

      <View style={styles.footer}>
        {/* No `adjustsFontSizeToFit`: this card lives in a ScrollView, where
            its measurement can collapse the text to a few pixels and
            `minimumFontScale` does not bound it (see CLAUDE.md). */}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {activity.title}
        </Text>
        <View style={styles.chevron}>
          <SymbolView
            name="chevron.right"
            size={12}
            tintColor={colors.secondaryText}
            weight="semibold"
            fallback={<Text style={styles.chevronFallback}>›</Text>}
          />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    aspectRatio: 0.9,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  artArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  title: {
    ...typography.label,
    fontSize: 16,
    color: colors.primaryText,
    flexShrink: 1,
    flexGrow: 1,
  },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronFallback: {
    fontSize: 17,
    lineHeight: 20,
    color: colors.secondaryText,
  },
});
