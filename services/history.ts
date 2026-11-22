import { ActivityId, activityById } from '../data/activities';
import { loadJSON, saveJSON, StorageKeys } from './storage';

export interface HistoryEntry {
  id: string;
  activity: ActivityId;
  /** The headline outcome: "Heads", "8", "Ace of Hearts". */
  label: string;
  /** Optional qualifier: "Best of three", "2 dice", "from 1–100". */
  detail?: string;
  /** Epoch milliseconds. */
  at: number;
}

/** Old results stop being interesting long before they stop taking up space. */
const MAX_ENTRIES = 200;

/**
 * A tiny observable store over AsyncStorage.
 *
 * History is written from activity screens and read from a tab, which are never
 * mounted at the same time — so a plain `useEffect` load would show stale data
 * on every visit. Subscribers instead share one in-memory cache that updates
 * the moment a result is recorded.
 */
let cache: HistoryEntry[] | null = null;
let loading: Promise<HistoryEntry[]> | null = null;
const listeners = new Set<(entries: HistoryEntry[]) => void>();

let counter = 0;
function nextId(): string {
  counter += 1;
  return `h-${Date.now().toString(36)}-${counter}`;
}

function isEntry(value: unknown): value is HistoryEntry {
  const e = value as HistoryEntry;
  return (
    !!e &&
    typeof e === 'object' &&
    typeof e.id === 'string' &&
    typeof e.label === 'string' &&
    Number.isFinite(e.at) &&
    // The activity must still exist. Rows look it up directly, so an entry
    // left behind by a removed activity would otherwise crash the whole tab.
    typeof e.activity === 'string' &&
    e.activity in activityById
  );
}

function load(): Promise<HistoryEntry[]> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = loadJSON<unknown>(StorageKeys.history, []).then((stored) => {
      cache = Array.isArray(stored)
        ? stored.filter(isEntry).slice(0, MAX_ENTRIES)
        : [];
      return cache;
    });
  }
  return loading;
}

function emit() {
  const snapshot = cache ?? [];
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeHistory(
  listener: (entries: HistoryEntry[]) => void
): () => void {
  listeners.add(listener);
  load().then((entries) => {
    // The subscriber may have unmounted while the first load was in flight.
    if (listeners.has(listener)) listener(entries);
  });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Fire-and-forget: recording a result must never delay or fail the animation
 * that produced it.
 */
export function recordResult(entry: Omit<HistoryEntry, 'id' | 'at'>): void {
  load().then((entries) => {
    cache = [{ ...entry, id: nextId(), at: Date.now() }, ...entries].slice(
      0,
      MAX_ENTRIES
    );
    emit();
    saveJSON(StorageKeys.history, cache);
  });
}

export function clearHistory(): void {
  cache = [];
  emit();
  saveJSON(StorageKeys.history, []);
}
