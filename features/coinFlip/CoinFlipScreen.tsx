import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Coin, CoinHandle } from './Coin';
import { useCoinFlip } from './useCoinFlip';
import { CoinMode } from './types';
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

const MODE_OPTIONS: SegmentOption<CoinMode>[] = [
  { value: 'one', label: 'One coin' },
  { value: 'bestOfThree', label: 'Best of three' },
];


const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

interface CoinFlipScreenProps {
  onBack: () => void;
}

export function CoinFlipScreen({ onBack }: CoinFlipScreenProps) {
  const { width } = useWindowDimensions();
  const coinRef = useRef<CoinHandle>(null);
  const [stageHeight, setStageHeight] = useState(0);

  const { select, peek } = useRequestedEnd();
  const {
    mode,
    changeMode,
    isFlipping,
    requestFlip,
    handleSettled,
    display,
    resultKey,
    buttonLabel,
  } = useCoinFlip(coinRef, { peekRequestedEnd: peek });

  const coinSize = useMemo(() => Math.min(Math.round(width * 0.46), 190), [width]);

  // Keep the toss tall enough to feel thrown, but short enough that the coin
  // never sails off the top of a small screen.
  const apex = useMemo(
    () => clamp(stageHeight / 2 - coinSize / 2 + 72, 140, 290),
    [coinSize, stageHeight]
  );

  const handleStageLayout = useCallback((e: LayoutChangeEvent) => {
    setStageHeight(e.nativeEvent.layout.height);
  }, []);

  // Tap and swipe-up are two ways into the same flip; Race lets a quick tap
  // win before the pan ever activates.

  return (
    <ActivityScreen title={activityById['coin'].title} onBack={onBack}>
      <View style={styles.stage} onLayout={handleStageLayout}>
        <HiddenOutcomeZones onSelect={select} />

        <HeroStage
          onActivate={requestFlip}
          accessibilityLabel="Coin"
          accessibilityHint="Double tap to flip the coin"
        >
          <Coin
            ref={coinRef}
            size={coinSize}
            apex={apex}
            onSettled={handleSettled}
          />
        </HeroStage>
      </View>

      <View style={styles.controls}>
        <ResultCard
          title={display.title}
          subtitle={display.subtitle}
          animationKey={resultKey}
        />

        <SegmentedControl
          options={MODE_OPTIONS}
          value={mode}
          onChange={changeMode}
          accessibilityLabel="Coin mode"
        />

        <PrimaryButton
          label={buttonLabel}
          onPress={requestFlip}
          tone="accent"
          accent="coin"
          disabled={isFlipping}
          accessibilityHint="Flips the coin"
        />
      </View>
    </ActivityScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
});
