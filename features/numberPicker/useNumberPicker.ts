import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { randomInt } from '../../services/random';
import { recordResult } from '../../services/history';
import { loadJSON, saveJSON, StorageKeys } from '../../services/storage';
import { NumberClusterHandle } from './NumberCluster';
import { RequestedEndOptions } from '../../components';
import {
  DEFAULT_MAX,
  DEFAULT_MIN,
  RANGE_LIMIT,
  RANGE_PRESETS,
} from './types';

const SAVE_DEBOUNCE_MS = 400;

interface Range {
  min: number;
  max: number;
}

function parseField(text: string, fallback: number): number {
  const n = Number.parseInt(text, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 0), RANGE_LIMIT);
}

function isRange(v: unknown): v is Range {
  return (
    !!v &&
    typeof v === 'object' &&
    Number.isFinite((v as Range).min) &&
    Number.isFinite((v as Range).max) &&
    (v as Range).min <= (v as Range).max
  );
}

/**
 * Owns the range and the outcome. The cluster is told which number to settle
 * on and never chooses one itself.
 *
 * The committed `range` is kept separate from the two text drafts so that a
 * half-typed value ("" or "1" on the way to "100") never reaches the cluster
 * and makes it re-layout mid-edit.
 */
export function useNumberPicker(
  clusterRef: React.RefObject<NumberClusterHandle | null>,
  { peekRequestedEnd }: RequestedEndOptions
) {
  const [range, setRange] = useState<Range>({
    min: DEFAULT_MIN,
    max: DEFAULT_MAX,
  });
  const [minText, setMinText] = useState(String(DEFAULT_MIN));
  const [maxText, setMaxText] = useState(String(DEFAULT_MAX));
  const [result, setResult] = useState<number | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const rangeRef = useRef(range);
  rangeRef.current = range;
  // Read at event time, so a commit and a pick in the same tick agree.
  const textsRef = useRef({ minText, maxText });
  textsRef.current = { minText, maxText };
  const pending = useRef(0);
  const hydrated = useRef(false);

  useEffect(() => {
    let alive = true;
    loadJSON<unknown>(StorageKeys.numberRange, null).then((stored) => {
      if (!alive) return;
      if (isRange(stored)) {
        setRange(stored);
        setMinText(String(stored.min));
        setMaxText(String(stored.max));
      }
      hydrated.current = true;
    });
    return () => {
      alive = false;
    };
  }, []);

  // Guarded on `hydrated`, or the defaults would overwrite the stored range
  // before the load resolves.
  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => {
      saveJSON(StorageKeys.numberRange, range);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [range]);

  const applyRange = useCallback((next: Range) => {
    setRange(next);
    setMinText(String(next.min));
    setMaxText(String(next.max));
    setResult(null);
  }, []);

  /** Reversed bounds are a typo, not an error — read them the way they're meant. */
  const normalize = useCallback((): Range => {
    const a = parseField(textsRef.current.minText, rangeRef.current.min);
    const b = parseField(textsRef.current.maxText, rangeRef.current.max);
    return a <= b ? { min: a, max: b } : { min: b, max: a };
  }, []);

  const commitRange = useCallback(() => {
    applyRange(normalize());
  }, [applyRange, normalize]);

  const selectPreset = useCallback(
    (value: string) => {
      const preset = RANGE_PRESETS.find((p) => p.value === value);
      if (!preset) return;
      applyRange({ min: preset.min, max: preset.max });
    },
    [applyRange]
  );

  const requestPick = useCallback(() => {
    if (isPicking || clusterRef.current?.isPicking()) return;

    // A number pad has no Return key, so the fields commit on blur — and
    // tapping Pick blurs first. Re-derive from the fields rather than trusting
    // state that has not re-rendered yet.
    const next = normalize();
    if (next.min !== rangeRef.current.min || next.max !== rangeRef.current.max) {
      applyRange(next);
    }

    // The one place a pre-selected outcome is allowed to influence anything.
    // Bounds rather than specific numbers, so the gesture means the same
    // thing at 1–10 as it does at 1–9999.
    const end = peekRequestedEnd();
    pending.current =
      end === 'low'
        ? next.min
        : end === 'high'
          ? next.max
          : randomInt(next.min, next.max);
    setResult(null);
    setIsPicking(true);
    clusterRef.current?.pick(pending.current, next);
  }, [applyRange, clusterRef, isPicking, normalize, peekRequestedEnd]);

  const handleSettled = useCallback(() => {
    recordResult({
      activity: 'numbers',
      label: String(pending.current),
      detail: `from ${rangeRef.current.min}–${rangeRef.current.max}`,
    });
    setResult(pending.current);
    setIsPicking(false);
  }, []);

  /** Empty when the range matches no preset, which hides the thumb. */
  const activePreset = useMemo(
    () =>
      RANGE_PRESETS.find(
        (p) => p.min === range.min && p.max === range.max
      )?.value ?? '',
    [range]
  );

  const display = useMemo(() => {
    const span = `${range.min}–${range.max}`;
    if (isPicking) return { title: '', subtitle: undefined };
    if (result === null) {
      return { title: '—', subtitle: `Tap to pick from ${span}.` };
    }
    return { title: String(result), subtitle: `Picked from ${span}.` };
  }, [isPicking, range, result]);

  return {
    range,
    minText,
    maxText,
    setMinText,
    setMaxText,
    commitRange,
    activePreset,
    selectPreset,
    result,
    isPicking,
    requestPick,
    handleSettled,
    display,
    resultKey: result === null ? 'idle' : `${result}:${range.min}:${range.max}`,
    buttonLabel: result === null ? 'Pick' : 'Pick again',
  };
}
