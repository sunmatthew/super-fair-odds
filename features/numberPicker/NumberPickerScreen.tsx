import React, { useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { NumberCluster, NumberClusterHandle } from './NumberCluster';
import { RangeCard } from './RangeCard';
import { useNumberPicker } from './useNumberPicker';
import { RANGE_PRESETS } from './types';
import {
  ActivityScreen,
  HeroStage,
  HiddenOutcomeZones,
  PrimaryButton,
  ResultCard,
  SegmentedControl,
  SegmentOption,
  useRequestedEnd,
} from '../../components';
import { activityById } from '../../data/activities';
import { spacing } from '../../theme';

const PRESET_OPTIONS: SegmentOption<string>[] = RANGE_PRESETS.map((p) => ({
  value: p.value,
  label: p.label,
}));


interface NumberPickerScreenProps {
  onBack: () => void;
}

export function NumberPickerScreen({ onBack }: NumberPickerScreenProps) {
  const { width } = useWindowDimensions();
  const clusterRef = useRef<NumberClusterHandle>(null);

  const { select, peek } = useRequestedEnd();
  const {
    range,
    minText,
    maxText,
    setMinText,
    setMaxText,
    commitRange,
    activePreset,
    selectPreset,
    isPicking,
    requestPick,
    handleSettled,
    display,
    resultKey,
    buttonLabel,
  } = useNumberPicker(clusterRef, { peekRequestedEnd: peek });

  // The cluster is six smaller satellites now rather than nine large ones, so
  // the hero can take the space they gave back and still clear the gutters on
  // the narrowest phone.
  const heroSize = useMemo(
    () => Math.min(Math.round(width * 0.36), 150),
    [width]
  );


  return (
    <ActivityScreen title={activityById['numbers'].title} onBack={onBack}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Zones first: later siblings take the touch, so the cluster always
              wins its own area. */}
          <View style={styles.stage}>
            <HiddenOutcomeZones onSelect={select} />

            <HeroStage
              onActivate={requestPick}
              flick="any"
              accessibilityLabel="Number picker"
              accessibilityHint="Double tap to pick a number"
            >
              <NumberCluster
                ref={clusterRef}
                min={range.min}
                max={range.max}
                heroSize={heroSize}
                onSettled={handleSettled}
              />
            </HeroStage>
          </View>

          <ResultCard
            variant="numeric"
            title={display.title}
            subtitle={display.subtitle}
            animationKey={resultKey}
          />

          <SegmentedControl
            options={PRESET_OPTIONS}
            value={activePreset}
            onChange={selectPreset}
            accessibilityLabel="Range preset"
          />

          <RangeCard
            minText={minText}
            maxText={maxText}
            onChangeMin={setMinText}
            onChangeMax={setMaxText}
            onCommit={commitRange}
            disabled={isPicking}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={buttonLabel}
            onPress={requestPick}
            disabled={isPicking}
            accessibilityHint="Picks a number from the range"
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
    // The cluster fills this box's width on every phone, so the hidden zones
    // would have no room of their own. This band is theirs.
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
