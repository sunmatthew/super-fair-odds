import React, { useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { Wheel, WheelHandle } from './Wheel';
import { useWheel } from './useWheel';
import { segmentColor } from './types';
import {
  ActivityScreen,
  HeroStage,
  HiddenOutcomeZones,
  OptionListCard,
  PrimaryButton,
  ResultCard,
  useRequestedEnd,
} from '../../components';
import { activityById } from '../../data/activities';
import { spacing } from '../../theme';


interface WheelScreenProps {
  onBack: () => void;
}

export function WheelScreen({ onBack }: WheelScreenProps) {
  const { width } = useWindowDimensions();
  const wheelRef = useRef<WheelHandle>(null);

  const { select, peek } = useRequestedEnd();
  const {
    options,
    isSpinning,
    requestSpin,
    handleSettled,
    changeLabel,
    commitLabel,
    removeOption,
    addOption,
    canRemove,
    canAdd,
    display,
    resultKey,
    buttonLabel,
  } = useWheel(wheelRef, { peekRequestedEnd: peek });

  const wheelSize = useMemo(
    () => Math.min(Math.round(width * 0.72), 300),
    [width]
  );

  const items = useMemo(
    () =>
      options.map((o, i) => ({
        id: o.id,
        label: o.label,
        color: segmentColor(i),
      })),
    [options]
  );


  return (
    <ActivityScreen title={activityById['wheel'].title} onBack={onBack}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          // Taps on non-touchables do not blur a field, so scrolling is the
          // escape hatch from the keyboard.
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Zones first: later siblings take the touch, so the wheel always
              wins its own area. */}
          <View style={styles.stage}>
            <HiddenOutcomeZones onSelect={select} />

            <HeroStage
              onActivate={requestSpin}
              flick="any"
              accessibilityLabel="Wheel"
              accessibilityHint="Double tap to spin"
            >
              <Wheel
                ref={wheelRef}
                size={wheelSize}
                count={options.length}
                onSettled={handleSettled}
              />
            </HeroStage>
          </View>

          <ResultCard
            title={display.title}
            subtitle={display.subtitle}
            animationKey={resultKey}
          />

          <OptionListCard
            title="Custom options"
            subtitle="Edit the options that appear on your wheel."
            items={items}
            onChangeLabel={changeLabel}
            onCommitLabel={commitLabel}
            onRemove={removeOption}
            onAdd={addOption}
            canRemove={canRemove}
            canAdd={canAdd}
            disabled={isSpinning}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={buttonLabel}
            onPress={requestSpin}
            disabled={isSpinning}
            accessibilityHint="Spins the wheel"
          />
        </View>
      </KeyboardAvoidingView>
    </ActivityScreen>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scroll: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    // The wheel fills this box's width on every phone, so the hidden zones
    // would have no room of their own. This band is theirs.
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
