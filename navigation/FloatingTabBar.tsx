import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { PressableScale } from '../components/PressableScale';
import { colors, gutter, radius, shadows, spacing, typography } from '../theme';

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_MARGIN = spacing.xs;

/** Vertical space a scrolling tab screen should leave clear at the bottom. */
export const TAB_BAR_SPACE = TAB_BAR_HEIGHT + TAB_BAR_MARGIN * 2;

const ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'house.fill', inactive: 'house' },
  History: { active: 'clock.fill', inactive: 'clock' },
};

/**
 * A floating pill rather than a full-bleed bar, so the warm background stays
 * visible underneath and the chrome keeps the same card language as Home.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const icons = ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <PressableScale
              key={route.key}
              onPress={onPress}
              haptic="soft"
              scaleTo={0.94}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
            >
              <SymbolView
                name={(focused ? icons.active : icons.inactive) as never}
                size={23}
                tintColor={focused ? colors.primaryText : colors.secondaryText}
                fallback={<View style={styles.iconFallback} />}
              />
              <Text
                style={[styles.label, focused ? styles.labelActive : null]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: gutter - spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: TAB_BAR_HEIGHT,
    marginBottom: TAB_BAR_MARGIN,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    color: colors.secondaryText,
  },
  labelActive: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  iconFallback: {
    width: 23,
    height: 23,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryText,
  },
});
