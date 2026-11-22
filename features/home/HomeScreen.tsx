import React, { useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { ActivityCard, Screen } from '../../components';
import { activities, Activity } from '../../data/activities';
import { ActivityRoute } from '../../navigation/types';
import { colors, gutter, spacing, typography } from '../../theme';
import { TAB_BAR_SPACE } from '../../navigation/FloatingTabBar';

const COLUMNS = 2;
const GAP = spacing.md;

interface HomeScreenProps {
  onOpenActivity: (route: ActivityRoute) => void;
}

export function HomeScreen({ onOpenActivity }: HomeScreenProps) {
  const { width } = useWindowDimensions();

  const cardWidth = useMemo(
    () => (width - gutter * 2 - GAP * (COLUMNS - 1)) / COLUMNS,
    [width]
  );

  const handlePress = useCallback(
    (activity: Activity) => onOpenActivity(activity.route),
    [onOpenActivity]
  );

  return (
    <Screen edges={{ top: true, bottom: false }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Super Fair Odds
          </Text>
          <Text style={styles.subtitle}>
            Simple tools for life&rsquo;s little decisions.
          </Text>
        </View>

        <View style={styles.grid}>
          {activities.map((activity) => (
            <View key={activity.id} style={{ width: cardWidth }}>
              <ActivityCard activity={activity} onPress={handlePress} />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: gutter,
    paddingTop: spacing.xs,
    paddingBottom: TAB_BAR_SPACE + spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.display,
    color: colors.primaryText,
  },
  subtitle: {
    ...typography.body,
    color: colors.secondaryText,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});
