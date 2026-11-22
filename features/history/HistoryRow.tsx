import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityArt } from '../../components';
import { activityById } from '../../data/activities';
import { HistoryEntry } from '../../services/history';
import { formatTime } from './useHistory';
import { accents, colors, radius, spacing, typography } from '../../theme';

interface HistoryRowProps {
  entry: HistoryEntry;
  /** Hairline between rows, omitted on the last of a day. */
  showDivider: boolean;
}

export function HistoryRow({ entry, showDivider }: HistoryRowProps) {
  const activity = activityById[entry.activity];
  const palette = accents[activity.accent];
  const when = formatTime(entry.at);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${activity.title}: ${entry.label}${
        entry.detail ? `, ${entry.detail}` : ''
      }, ${when}`}
    >
      <View style={[styles.emblem, { backgroundColor: palette.soft }]}>
        <ActivityArt art={activity.art} accent={activity.accent} size={19} />
      </View>

      <View style={styles.text}>
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {entry.label}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {entry.detail ? `${activity.title} · ${entry.detail}` : activity.title}
        </Text>
      </View>

      <Text style={styles.time}>{when}</Text>

      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  emblem: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
  label: {
    ...typography.label,
    fontSize: 17,
    color: colors.primaryText,
  },
  detail: {
    ...typography.caption,
    color: colors.secondaryText,
  },
  time: {
    ...typography.caption,
    color: colors.tertiaryText,
  },
  divider: {
    position: 'absolute',
    left: spacing.md + 36 + spacing.sm,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
