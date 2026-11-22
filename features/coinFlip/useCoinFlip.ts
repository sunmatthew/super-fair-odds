import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { coinToss, randomInt } from '../../services/random';
import { recordResult } from '../../services/history';
import { CoinHandle } from './Coin';
import { CoinMode, Side, SIDE_LABEL } from './types';
import { RequestedEndOptions } from '../../components';

/** Pause between rounds of a series, so each landing reads before the next. */
const ROUND_GAP_MS = 700;
const ROUNDS_TO_WIN = 2;
const MAX_ROUNDS = 3;

function tally(completed: Side[]) {
  const heads = completed.filter((r) => r === 'heads').length;
  return { heads, tails: completed.length - heads };
}

function winnerOf(completed: Side[]): Side | null {
  const { heads, tails } = tally(completed);
  if (heads >= ROUNDS_TO_WIN) return 'heads';
  if (tails >= ROUNDS_TO_WIN) return 'tails';
  return null;
}

/**
 * Every round a rigged series will play, decided in one go.
 *
 * A forced series has to *look* like a series. An honest best-of-three that
 * `winner` happens to win ends 2–0 only half the time: the three ways it can
 * go are WW, WLW and LWW, which are 1/4, 1/8 and 1/8 of all series and so
 * normalise to 1/2, 1/4, 1/4 once you know `winner` won. Winning every
 * individual round instead made it 2–0 every single time, and a best-of-three
 * that is never 2–1 is a tell you can read from across the table.
 *
 * Drawing the whole series up front is also how the rest of this hook thinks
 * about it: a series is one outcome, not three. Which means a request that
 * changes mid-series does not reroute one already in flight.
 */
function scriptSeries(winner: Side): Side[] {
  const loser: Side = winner === 'heads' ? 'tails' : 'heads';
  const roll = randomInt(1, 4);
  if (roll <= 2) return [winner, winner]; // 2/4 — 2–0
  if (roll === 3) return [winner, loser, winner]; // 1/4 — 2–1
  return [loser, winner, winner]; // 1/4 — 2–1, dropping the first round
}

/**
 * Owns *what* the coin lands on and *when* a result is shown. The animation
 * knows nothing about how the outcome was chosen: it is handed a side and its
 * only job is to arrive there convincingly.
 *
 *   requested outcome  ─┐
 *                       ├─> resolveOutcome() ─> coin.flip(side) ─> onSettled
 *   random toss        ─┘
 *
 * Results are only published once the coin has physically settled.
 */
export function useCoinFlip(
  coinRef: React.RefObject<CoinHandle | null>,
  { peekRequestedEnd }: RequestedEndOptions
) {
  const [mode, setMode] = useState<CoinMode>('one');
  const [isFlipping, setIsFlipping] = useState(false);
  const [rounds, setRounds] = useState<Side[]>([]);

  // Mirrors of the above, so the settle handler can read current values
  // without being re-created mid-series.
  const modeRef = useRef(mode);
  const roundsRef = useRef<Side[]>([]);

  const nextRoundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rounds still owed by a rigged series, or null when play is honest. A ref
  // for the same reason the request itself is one: a re-render would tell.
  const scriptedRounds = useRef<Side[] | null>(null);

  const clearPendingRound = useCallback(() => {
    if (nextRoundTimer.current !== null) {
      clearTimeout(nextRoundTimer.current);
      nextRoundTimer.current = null;
    }
  }, []);

  useEffect(() => clearPendingRound, [clearPendingRound]);

  /** The one place a pre-selected outcome is allowed to influence anything. */
  const requestedSide = useCallback((): Side | null => {
    const end = peekRequestedEnd();
    return end === null ? null : end === 'low' ? 'heads' : 'tails';
  }, [peekRequestedEnd]);

  const resolveOutcome = useCallback((): Side => {
    // A scripted series has already decided this round; a single flip and an
    // honest series both fall through.
    const scripted = scriptedRounds.current?.shift();
    if (scripted) return scripted;
    return requestedSide() ?? (coinToss() ? 'heads' : 'tails');
  }, [requestedSide]);

  const startFlip = useCallback(() => {
    if (coinRef.current?.isFlipping()) return;
    setIsFlipping(true);
    coinRef.current?.flip(resolveOutcome());
  }, [coinRef, resolveOutcome]);

  /** Called by the coin at the end of its landing, never before. */
  const handleSettled = useCallback(
    (result: Side) => {
      const completed = [...roundsRef.current, result];
      roundsRef.current = completed;
      setRounds(completed);

      if (modeRef.current === 'one') {
        recordResult({ activity: 'coin', label: SIDE_LABEL[result] });
      } else {
        // A series is one outcome, not three — only log it once it is decided.
        const winner = winnerOf(completed);
        if (winner) {
          const { heads, tails } = tally(completed);
          recordResult({
            activity: 'coin',
            label: `${SIDE_LABEL[winner]} wins`,
            detail: `Best of three · ${heads}–${tails}`,
          });
        }
      }

      const seriesContinues =
        modeRef.current === 'bestOfThree' &&
        winnerOf(completed) === null &&
        completed.length < MAX_ROUNDS;

      if (seriesContinues) {
        clearPendingRound();
        nextRoundTimer.current = setTimeout(() => {
          nextRoundTimer.current = null;
          startFlip();
        }, ROUND_GAP_MS);
        return;
      }

      setIsFlipping(false);
    },
    [clearPendingRound, startFlip]
  );

  const resetSeries = useCallback(() => {
    clearPendingRound();
    roundsRef.current = [];
    scriptedRounds.current = null;
    setRounds([]);
  }, [clearPendingRound]);

  /** Tap, swipe, and the primary button all land here. */
  const requestFlip = useCallback(() => {
    if (isFlipping || coinRef.current?.isFlipping()) return;
    resetSeries();

    // Only a *series* needs scripting. Continuation rounds come straight from
    // `handleSettled`, so this runs exactly once per series.
    const wanted = requestedSide();
    if (modeRef.current === 'bestOfThree' && wanted) {
      scriptedRounds.current = scriptSeries(wanted);
    }

    startFlip();
  }, [coinRef, isFlipping, requestedSide, resetSeries, startFlip]);

  const changeMode = useCallback(
    (next: CoinMode) => {
      if (next === modeRef.current) return;
      modeRef.current = next;
      setMode(next);
      resetSeries();
      setIsFlipping(false);
    },
    [resetSeries]
  );

  const display = useMemo(() => {
    if (mode === 'one') {
      // Blank while the coin is in the air rather than reverting to the idle
      // copy, which read as the screen resetting mid-flip. A series keeps its
      // running tally visible between rounds, which is genuinely useful.
      if (isFlipping) return { title: '', subtitle: undefined };

      const result = rounds[rounds.length - 1];
      if (!result) {
        return { title: 'Ready', subtitle: 'Tap the coin to flip it.' };
      }
      return {
        title: SIDE_LABEL[result],
        subtitle: `The coin landed on ${result}.`,
      };
    }

    if (rounds.length === 0) {
      return { title: 'Best of three', subtitle: 'First side to two wins.' };
    }

    const { heads, tails } = tally(rounds);
    const score = `Heads ${heads} · Tails ${tails}`;
    const winner = winnerOf(rounds);

    return winner
      ? { title: `${SIDE_LABEL[winner]} wins`, subtitle: score }
      : { title: SIDE_LABEL[rounds[rounds.length - 1]], subtitle: score };
  }, [isFlipping, mode, rounds]);

  const hasResult = mode === 'one' ? rounds.length > 0 : winnerOf(rounds) !== null;

  return {
    mode,
    changeMode,
    isFlipping,
    requestFlip,
    handleSettled,
    display,
    /** Drives the ResultCard entrance animation. */
    resultKey: `${mode}:${rounds.join('')}`,
    buttonLabel: hasResult ? 'Flip again' : 'Flip',
  };
}
