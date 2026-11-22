import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Die, DieHandle } from './Die';
import { useDiceRoll } from './useDiceRoll';
import { DiceCount, DICE_COUNTS } from './types';
import {
  ActivityScreen,
  ChipRow,
  ChipOption,
  HeroStage,
  HiddenOutcomeZones,
  PrimaryButton,
  ResultCard,
  useRequestedEnd,
} from '../../components';
import { activityById } from '../../data/activities';
import { spacing } from '../../theme';

const COUNT_OPTIONS: ChipOption<DiceCount>[] = DICE_COUNTS.map((n) => ({
  value: n,
  label: n === 1 ? '1 die' : `${n} dice`,
}));

/** Die size shrinks as more of them share the stage. */
const DIE_SIZE: Record<DiceCount, { ratio: number; max: number }> = {
  1: { ratio: 0.34, max: 132 },
  2: { ratio: 0.26, max: 108 },
  3: { ratio: 0.2, max: 86 },
};


const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

interface DiceRollScreenProps {
  onBack: () => void;
}

export function DiceRollScreen({ onBack }: DiceRollScreenProps) {
  const { width } = useWindowDimensions();
  const dieRefs = useRef<(DieHandle | null)[]>([]);
  const [stageHeight, setStageHeight] = useState(0);

  const { select, peek } = useRequestedEnd();
  const {
    count,
    changeCount,
    total,
    isRolling,
    requestRoll,
    handleDieSettled,
    readout,
    subtitle,
    buttonLabel,
  } = useDiceRoll(dieRefs, { peekRequestedEnd: peek });

  const dieSize = useMemo(() => {
    const { ratio, max } = DIE_SIZE[count];
    return Math.min(Math.round(width * ratio), max);
  }, [count, width]);

  const apex = useMemo(
    () => clamp(stageHeight / 2 - dieSize / 2 + 56, 110, 230),
    [dieSize, stageHeight]
  );

  const handleStageLayout = useCallback((e: LayoutChangeEvent) => {
    setStageHeight(e.nativeEvent.layout.height);
  }, []);


  return (
    <ActivityScreen title={activityById['dice'].title} onBack={onBack}>
      <View style={styles.stage} onLayout={handleStageLayout}>
        <HiddenOutcomeZones onSelect={select} />

        <HeroStage
          style={styles.tray}
          onActivate={requestRoll}
          accessibilityLabel={total === null ? 'Dice' : `Dice, total ${total}`}
          accessibilityHint="Double tap to roll"
        >
          {Array.from({ length: count }, (_, i) => (
            <Die
              key={i}
              ref={(handle) => {
                dieRefs.current[i] = handle;
              }}
              size={dieSize}
              apex={apex}
              onSettled={handleDieSettled}
            />
          ))}
        </HeroStage>
      </View>

      <View style={styles.controls}>
        <ResultCard
          overline="Total"
          title={readout}
          subtitle={subtitle}
          variant="numeric"
          animationKey={`${count}:${total ?? 'none'}`}
        />

        <ChipRow
          options={COUNT_OPTIONS}
          value={count}
          onChange={changeCount}
          accessibilityLabel="Number of dice"
        />

        <PrimaryButton
          label={buttonLabel}
          onPress={requestRoll}
          disabled={isRolling}
          accessibilityHint="Rolls the dice"
        />
      </View>
    </ActivityScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  controls: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
});
