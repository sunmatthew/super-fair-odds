import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  clearHistory,
  HistoryEntry,
  subscribeHistory,
} from '../../services/history';

export interface HistorySection {
  title: string;
  data: HistoryEntry[];
}

const DAY_MS = 86_400_000;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today" / "Yesterday" / "12 September" — relative where it helps, absolute where it doesn't. */
function dayLabel(at: number, now: number): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Date(at).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    ...(new Date(at).getFullYear() === new Date(now).getFullYear()
      ? {}
      : { year: 'numeric' }),
  });
}

export function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Subscribes to the shared history store. Entries arrive newest-first and are
 * grouped into day sections for display.
 */
export function useHistory() {
  // `null` distinguishes "still loading" from "genuinely empty", so the empty
  // state never flashes before the first read resolves.
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => subscribeHistory(setEntries), []);

  const sections = useMemo<HistorySection[]>(() => {
    if (!entries?.length) return [];
    const now = Date.now();
    const out: HistorySection[] = [];
    for (const entry of entries) {
      const title = dayLabel(entry.at, now);
      const last = out[out.length - 1];
      if (last && last.title === title) last.data.push(entry);
      else out.push({ title, data: [entry] });
    }
    return out;
  }, [entries]);

  const clear = useCallback(() => clearHistory(), []);

  return {
    loading: entries === null,
    isEmpty: entries !== null && entries.length === 0,
    count: entries?.length ?? 0,
    sections,
    clear,
  };
}
