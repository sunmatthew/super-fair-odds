import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Disc } from './Disc';
import {
  HERO_COLOR,
  MAX_SATELLITES,
  rangeSize,
  SATELLITE_ANCHORS,
  SATELLITE_RATIO,
} from './types';
import { randomInt } from '../../services/random';
import { pastelAt } from '../../theme';

export interface NumberClusterHandle {
  /**
   * Churns the cluster and settles the hero on `value`. `range` overrides the
   * current props for this pick, so a pick triggered in the same tick as a
   * range edit still samples from the new bounds.
   */
  pick: (value: number, range?: { min: number; max: number }) => void;
  isPicking: () => boolean;
}

interface NumberClusterProps {
  min: number;
  max: number;
  heroSize: number;
  onSettled?: () => void;
}

/**
 * Decelerating cadence for the churn. Each entry is the gap before the next
 * re-roll, so the cluster visibly slows into its result rather than stopping
 * dead. Totals ~725ms.
 */
const CHURN_INTERVALS = [55, 55, 60, 65, 75, 85, 95, 110, 125];
/** Ticks near the end that get a haptic, so it clicks as it slows. */
const TICKS_WITH_HAPTIC = 3;
const SETTLE_STAGGER_MS = 30;

const RADIUS = SATELLITE_RATIO / 2;

/** Other numbers to show around the hero: the real ones if they fit, else a sample. */
function sampleOthers(
  min: number,
  max: number,
  exclude: number,
  count: number
): number[] {
  if (count <= 0) return [];

  if (rangeSize(min, max) - 1 <= count) {
    const all: number[] = [];
    for (let v = min; v <= max; v += 1) {
      if (v !== exclude) all.push(v);
    }
    return all;
  }

  const picked = new Set<number>();
  while (picked.size < count) {
    const v = randomInt(min, max);
    if (v !== exclude) picked.add(v);
  }
  return [...picked];
}

export const NumberCluster = forwardRef<NumberClusterHandle, NumberClusterProps>(
  function NumberCluster({ min, max, heroSize, onSettled }, ref) {
    const satelliteSize = heroSize * SATELLITE_RATIO;
    const satelliteCount = Math.max(
      0,
      Math.min(MAX_SATELLITES, rangeSize(min, max) - 1)
    );

    const [hero, setHero] = useState(min);
    const [others, setOthers] = useState<number[]>([]);
    const [tick, setTick] = useState(0);
    const [agitating, setAgitating] = useState(false);

    const busy = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reduceMotion = useReducedMotion();

    const rangeRef = useRef({ min, max, satelliteCount });
    rangeRef.current = { min, max, satelliteCount };

    const clearTimer = useCallback(() => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    }, []);

    useEffect(() => clearTimer, [clearTimer]);

    // Resting arrangement, and whenever the range changes between picks.
    useEffect(() => {
      if (busy.current) return;
      setHero(min);
      setOthers(sampleOthers(min, max, min, satelliteCount));
    }, [min, max, satelliteCount]);

    // Geometry derives entirely from the anchors, so the cluster scales as one.
    const box = useMemo(() => {
      const xs = SATELLITE_ANCHORS.slice(0, satelliteCount);
      const minX = Math.min(-0.5, ...xs.map((a) => a.x - RADIUS));
      const maxX = Math.max(0.5, ...xs.map((a) => a.x + RADIUS));
      const minY = Math.min(-0.5, ...xs.map((a) => a.y - RADIUS));
      const maxY = Math.max(0.5, ...xs.map((a) => a.y + RADIUS));
      return {
        width: (maxX - minX) * heroSize,
        height: (maxY - minY) * heroSize,
        cx: -minX * heroSize,
        cy: -minY * heroSize,
      };
    }, [heroSize, satelliteCount]);

    const settle = useCallback(
      (value: number) => {
        const { min: lo, max: hi, satelliteCount: n } = rangeRef.current;
        setHero(value);
        setOthers(sampleOthers(lo, hi, value, n));
        setAgitating(false);
        busy.current = false;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSettled?.();
      },
      [onSettled]
    );

    const pick = useCallback(
      (value: number, range?: { min: number; max: number }) => {
        if (busy.current) return;
        busy.current = true;
        clearTimer();

        if (range) {
          rangeRef.current = {
            min: range.min,
            max: range.max,
            satelliteCount: Math.max(
              0,
              Math.min(MAX_SATELLITES, rangeSize(range.min, range.max) - 1)
            ),
          };
        }

        if (reduceMotion) {
          settle(value);
          return;
        }

        setAgitating(true);

        let step = 0;
        const advance = () => {
          const { min: lo, max: hi, satelliteCount: n } = rangeRef.current;

          if (step >= CHURN_INTERVALS.length) {
            timer.current = null;
            settle(value);
            return;
          }

          // Every disc shows a throwaway number while it churns; only the
          // final settle writes the real one.
          const shown = randomInt(lo, hi);
          setHero(shown);
          setOthers(sampleOthers(lo, hi, shown, n));
          setTick((t) => t + 1);

          if (step >= CHURN_INTERVALS.length - TICKS_WITH_HAPTIC) {
            Haptics.selectionAsync();
          }

          const wait = CHURN_INTERVALS[step];
          step += 1;
          timer.current = setTimeout(advance, wait);
        };

        advance();
      },
      [clearTimer, reduceMotion, settle]
    );

    useImperativeHandle(
      ref,
      () => ({ pick, isPicking: () => busy.current }),
      [pick]
    );

    return (
      <View style={[styles.root, { width: box.width, height: box.height }]}>
        {SATELLITE_ANCHORS.slice(0, satelliteCount).map((anchor, i) => (
          <Disc
            key={i}
            value={others[i] ?? min}
            size={satelliteSize}
            color={pastelAt(i)}
            left={box.cx + anchor.x * heroSize - satelliteSize / 2}
            top={box.cy + anchor.y * heroSize - satelliteSize / 2}
            tick={tick}
            agitating={agitating}
            settleDelay={i * SETTLE_STAGGER_MS}
          />
        ))}

        <Disc
          value={hero}
          size={heroSize}
          color={HERO_COLOR}
          left={box.cx - heroSize / 2}
          top={box.cy - heroSize / 2}
          tick={tick}
          agitating={agitating}
          isHero
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
  },
});
