import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { PressableScale } from './PressableScale';
import { colors, radius, spacing, typography } from '../theme';

export interface OptionListItem {
  id: string;
  label: string;
  /** Swatch shown beside the row, tying it to its slice on the wheel. */
  color: string;
}

interface OptionListCardProps {
  title: string;
  subtitle?: string;
  items: OptionListItem[];
  onChangeLabel: (id: string, label: string) => void;
  /** Fired on blur, so the owner can tidy up an emptied field. */
  onCommitLabel: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string) => void;
  canRemove: boolean;
  canAdd: boolean;
  addPlaceholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

/**
 * A titled card of editable rows plus an add field. Kept generic so other
 * activities that need a user-supplied list can reuse it.
 */
export function OptionListCard({
  title,
  subtitle,
  items,
  onChangeLabel,
  onCommitLabel,
  onRemove,
  onAdd,
  canRemove,
  canAdd,
  addPlaceholder = 'Add an option',
  maxLength = 24,
  disabled = false,
}: OptionListCardProps) {
  const [draft, setDraft] = useState('');

  const submitDraft = useCallback(() => {
    const label = draft.trim();
    if (!label || !canAdd) return;
    onAdd(label);
    setDraft('');
  }, [canAdd, draft, onAdd]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.rows}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <TextInput
              style={styles.input}
              value={item.label}
              onChangeText={(text) => onChangeLabel(item.id, text)}
              onBlur={() => onCommitLabel(item.id)}
              maxLength={maxLength}
              editable={!disabled}
              returnKeyType="done"
              accessibilityLabel={`Option: ${item.label}`}
            />
            <PressableScale
              onPress={() => onRemove(item.id)}
              disabled={disabled || !canRemove}
              haptic="light"
              scaleTo={0.85}
              hitSlop={10}
              style={styles.remove}
              accessibilityLabel={`Remove ${item.label}`}
            >
              <SymbolView
                name="xmark"
                size={12}
                tintColor={
                  canRemove ? colors.secondaryText : colors.tertiaryText
                }
                weight="semibold"
                fallback={<Text style={styles.removeFallback}>×</Text>}
              />
            </PressableScale>
          </View>
        ))}

        <View style={[styles.row, styles.addRow]}>
          <View style={styles.addIcon}>
            <SymbolView
              name="plus"
              size={12}
              tintColor={colors.secondaryText}
              weight="semibold"
              fallback={<Text style={styles.removeFallback}>+</Text>}
            />
          </View>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitDraft}
            onBlur={submitDraft}
            placeholder={canAdd ? addPlaceholder : 'Option limit reached'}
            placeholderTextColor={colors.tertiaryText}
            maxLength={maxLength}
            editable={!disabled && canAdd}
            returnKeyType="done"
            accessibilityLabel={addPlaceholder}
          />
        </View>
      </View>
    </View>
  );
}

const ROW_HEIGHT = 48;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: {
    ...typography.label,
    fontSize: 20,
    color: colors.primaryText,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 15,
    color: colors.secondaryText,
    marginTop: 2,
  },
  rows: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: ROW_HEIGHT,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  addRow: {
    backgroundColor: colors.surfaceSunken,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    // Deliberately NOT spreading a typography token here. Those carry a
    // lineHeight tuned to their own fontSize; on an iOS TextInput a lineHeight
    // larger than the font's natural leading pushes the glyphs down inside the
    // line box, so the text stops aligning with the dot beside it — and the
    // extra padding inflates the row past its intended height.
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    color: colors.primaryText,
    paddingVertical: 0,
  },
  remove: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeFallback: {
    fontSize: 15,
    color: colors.secondaryText,
  },
  addIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
