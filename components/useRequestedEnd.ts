import { useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

import { OutcomeEnd } from './HiddenOutcomeZones';

/**
 * What an activity's hook needs in order to honour a pre-selected outcome.
 * Every activity takes this as its second argument, so the five read alike.
 */
export interface RequestedEndOptions {
  /** Returns a pre-selected end for the next outcome, or null for random. */
  peekRequestedEnd: () => OutcomeEnd | null;
}

/**
 * Holds an optional pre-selected outcome for the next go.
 *
 * Deliberately backed by a ref rather than state: a re-render here would be a
 * visual tell. Nothing in this module renders, and callers must not surface
 * its contents in the UI or in accessibility metadata.
 *
 * A selection persists until it is cleared by selecting the same end again.
 * Feedback is haptic only — one pulse for the low end, two for the high end,
 * a success notification on clear.
 */
export function useRequestedEnd() {
  const requested = useRef<OutcomeEnd | null>(null);
  const secondPulse = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The second pulse outlives the gesture by 80ms, which is long enough to
  // leave the screen in between.
  useEffect(
    () => () => {
      if (secondPulse.current !== null) clearTimeout(secondPulse.current);
    },
    []
  );

  const select = useCallback((end: OutcomeEnd) => {
    if (requested.current === end) {
      requested.current = null;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    requested.current = end;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (end === 'high') {
      secondPulse.current = setTimeout(() => {
        secondPulse.current = null;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 80);
    }
  }, []);

  /** Reads the pending selection, if any. Does not clear it. */
  const peek = useCallback(() => requested.current, []);

  return { select, peek };
}
