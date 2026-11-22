import React, { useCallback } from 'react';
import { Alert, SectionList, StyleSheet, Text, View } from 'react-native';

import { HistoryRow } from './HistoryRow';
import { useHistory } from './useHistory';
import { EmptyState, PressableScale, TabScreen } from '../../components';
import { HistoryEntry } from '../../services/history';
import { colors, gutter, radius, spacing, typography } from '../../theme';

export function HistoryScreen() {
  const { loading, isEmpty, count, sections, clear } = useHistory();

  const confirmClear = useCallback(() => {
    Alert.alert(
      'Clear history?',
      `This removes all ${count} results. It can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clear },
      ]
    );
  }, [clear, count]);

  // Hold the frame while the first read resolves rather than flashing the
  // empty state at someone who has plenty of history.
  if (loading) {
    return (
      <TabScreen title="History">
        <View />
      </TabScreen>
    );
  }

  if (isEmpty) {
    return (
      <TabScreen title="History">
        <EmptyState
          symbol="clock"
          title="No results yet"
          body="Flip, roll, draw, spin or pick something and it will show up here."
        />
      </TabScreen>
    );
  }

  return (
    <TabScreen
      title="History"
      centerContent={false}
      action={
        <PressableScale
          onPress={confirmClear}
          haptic="light"
          scaleTo={0.94}
          hitSlop={8}
          style={styles.clear}
          accessibilityLabel="Clear history"
          accessibilityHint={`Removes all ${count} results`}
        >
          <Text style={styles.clearLabel}>Clear</Text>
        </PressableScale>
      }
    >
      <SectionList
        sections={sections}
        keyExtractor={(entry: HistoryEntry) => entry.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.card,
              index === 0 && styles.cardFirst,
              index === section.data.length - 1 && styles.cardLast,
            ]}
          >
            <HistoryRow
              entry={item}
              showDivider={index < section.data.length - 1}
            />
          </View>
        )}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.secondaryText,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginLeft: spacing.xxs,
  },
  // Rows stack into one continuous card per day, so only the outer corners round.
  card: {
    backgroundColor: colors.surface,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardFirst: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  cardLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  clear: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearLabel: {
    ...typography.label,
    fontSize: 16,
    color: colors.secondaryText,
  },
});
