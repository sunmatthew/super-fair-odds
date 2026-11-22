import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { randomInt } from '../../services/random';
import { recordResult } from '../../services/history';
import { loadJSON, saveJSON, StorageKeys } from '../../services/storage';
import { WheelHandle } from './Wheel';
import { RequestedEndOptions } from '../../components';
import {
  defaultOptions,
  MAX_LABEL_LENGTH,
  MAX_OPTIONS,
  MIN_OPTIONS,
  newOptionId,
  WheelOption,
} from './types';

const SAVE_DEBOUNCE_MS = 400;

function isStoredShape(value: unknown): value is WheelOption[] {
  return (
    Array.isArray(value) &&
    value.length >= MIN_OPTIONS &&
    value.every(
      (o) =>
        o &&
        typeof o === 'object' &&
        typeof (o as WheelOption).id === 'string' &&
        typeof (o as WheelOption).label === 'string'
    )
  );
}

/**
 * Owns the option list and the outcome. The wheel is told which slice to stop
 * on; it never picks. The winner is published only once the wheel has settled.
 *
 * Options persist across launches. Editing the list clears the current result,
 * since the slices it referred to have changed.
 */
export function useWheel(
  wheelRef: React.RefObject<WheelHandle | null>,
  { peekRequestedEnd }: RequestedEndOptions
) {
  const [options, setOptions] = useState<WheelOption[]>(defaultOptions);
  const [result, setResult] = useState<WheelOption | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const pendingIndex = useRef(0);
  const hydrated = useRef(false);

  // Load once. Until this resolves the seeded defaults are shown.
  useEffect(() => {
    let alive = true;
    loadJSON<unknown>(StorageKeys.wheelOptions, null).then((stored) => {
      if (!alive) return;
      if (isStoredShape(stored)) {
        setOptions(stored.slice(0, MAX_OPTIONS));
      }
      hydrated.current = true;
    });
    return () => {
      alive = false;
    };
  }, []);

  // Persist changes. Guarded on `hydrated` — saving before the load resolves
  // would overwrite the user's stored list with the defaults.
  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => {
      saveJSON(StorageKeys.wheelOptions, options);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [options]);

  const requestSpin = useCallback(() => {
    if (isSpinning || wheelRef.current?.isSpinning()) return;
    const count = optionsRef.current.length;
    if (count < MIN_OPTIONS) return;

    // The one place a pre-selected outcome is allowed to influence anything.
    // The list is the user's own, so its ends are the only slices that can be
    // named without knowing what is on it.
    const end = peekRequestedEnd();
    pendingIndex.current =
      end === 'low' ? 0 : end === 'high' ? count - 1 : randomInt(0, count - 1);
    setResult(null);
    setIsSpinning(true);
    wheelRef.current?.spin(pendingIndex.current);
  }, [isSpinning, peekRequestedEnd, wheelRef]);

  const handleSettled = useCallback(() => {
    const landed = optionsRef.current[pendingIndex.current] ?? null;
    if (landed) {
      recordResult({ activity: 'wheel', label: landed.label });
    }
    setResult(landed);
    setIsSpinning(false);
  }, []);

  const changeLabel = useCallback((id: string, label: string) => {
    setResult(null);
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, label } : o))
    );
  }, []);

  /** An emptied field would leave a nameless slice; give it a fallback. */
  const commitLabel = useCallback((id: string) => {
    setOptions((prev) =>
      prev.map((o, i) =>
        o.id === id && o.label.trim().length === 0
          ? { ...o, label: `Option ${i + 1}` }
          : o
      )
    );
  }, []);

  const removeOption = useCallback((id: string) => {
    if (optionsRef.current.length <= MIN_OPTIONS) return;
    setResult(null);
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const addOption = useCallback((label: string) => {
    if (optionsRef.current.length >= MAX_OPTIONS) return;
    const trimmed = label.trim().slice(0, MAX_LABEL_LENGTH);
    if (!trimmed) return;
    setResult(null);
    setOptions((prev) => [...prev, { id: newOptionId(), label: trimmed }]);
  }, []);

  const display = useMemo(() => {
    if (isSpinning) return { title: '', subtitle: undefined };
    if (!result) {
      return { title: 'Ready', subtitle: 'Tap the wheel to spin it.' };
    }
    return {
      title: result.label,
      subtitle: `The wheel landed on ${result.label}.`,
    };
  }, [isSpinning, result]);

  return {
    options,
    result,
    isSpinning,
    requestSpin,
    handleSettled,
    changeLabel,
    commitLabel,
    removeOption,
    addOption,
    canRemove: options.length > MIN_OPTIONS,
    canAdd: options.length < MAX_OPTIONS,
    display,
    resultKey: result ? `${result.id}:${result.label}` : 'idle',
    buttonLabel: result ? 'Spin again' : 'Spin',
  };
}
