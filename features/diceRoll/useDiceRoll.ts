import { useCallback, useRef, useState } from 'react';

import { randomInt } from '../../services/random';
import { recordResult } from '../../services/history';
import { DieHandle } from './Die';
import { DiceCount, DieValue } from './types';
import { RequestedEndOptions } from '../../components';

/** Gap between each die leaving the hand, so they don't move in lockstep. */
const STAGGER_MS = 70;

/**
 * Owns what the dice land on and when the total is shown. As with the coin,
 * the values are decided up front and handed to the animation — the tumble
 * only has to arrive there.
 *
 * The total is published once *every* die has settled, never per-die.
 */
export function useDiceRoll(
  dieRefs: React.RefObject<(DieHandle | null)[]>,
  { peekRequestedEnd }: RequestedEndOptions
) {
  const [count, setCount] = useState<DiceCount>(2);
  const [values, setValues] = useState<DieValue[] | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const pending = useRef(0);
  const rolled = useRef<DieValue[]>([]);

  /** The one place a pre-selected outcome is allowed to influence anything. */
  const resolveValues = useCallback((): DieValue[] => {
    // The two ends of what dice can do, and the two that carry a name:
    // snake eyes and boxcars. Every die goes the same way, so a three-dice
    // request still reads as one deliberate extreme.
    const end = peekRequestedEnd();
    const roll = (): DieValue =>
      end ? (end === 'low' ? 1 : 6) : (randomInt(1, 6) as DieValue);
    return Array.from({ length: count }, roll);
  }, [count, peekRequestedEnd]);

  const requestRoll = useCallback(() => {
    if (isRolling) return;

    const next = resolveValues();

    rolled.current = next;
    pending.current = count;
    setValues(null); // clear the previous total rather than leave it stale
    setIsRolling(true);

    dieRefs.current
      ?.slice(0, count)
      .forEach((die, i) => die?.roll(next[i], i * STAGGER_MS));
  }, [count, dieRefs, isRolling, resolveValues]);

  const handleDieSettled = useCallback(() => {
    pending.current -= 1;
    if (pending.current > 0) return;

    const settled = rolled.current;
    const sum = settled.reduce((acc, v) => acc + v, 0);
    recordResult({
      activity: 'dice',
      label: String(sum),
      detail: `${settled.length} ${settled.length === 1 ? 'die' : 'dice'}`,
    });

    setValues(settled);
    setIsRolling(false);
  }, []);

  const changeCount = useCallback(
    (next: DiceCount) => {
      if (next === count || isRolling) return;
      dieRefs.current = [];
      pending.current = 0;
      rolled.current = [];
      setValues(null);
      setCount(next);
    },
    [count, dieRefs, isRolling]
  );

  const total = values?.reduce((sum, v) => sum + v, 0) ?? null;
  const diceWord = count === 1 ? 'die' : 'dice';

  return {
    count,
    changeCount,
    values,
    total,
    isRolling,
    requestRoll,
    handleDieSettled,
    /** Em dash at rest, blank mid-roll, the total once everything has settled. */
    readout: isRolling ? '' : total === null ? '—' : String(total),
    /**
     * Always present, so the card keeps one height across all three states —
     * an absent subtitle at rest made the layout jump on the first roll.
     */
    subtitle: isRolling
      ? undefined
      : total === null
        ? `Tap the ${diceWord} to roll.`
        : `Rolled ${count} ${diceWord}.`,
    buttonLabel: total === null ? 'Roll' : 'Roll again',
  };
}
