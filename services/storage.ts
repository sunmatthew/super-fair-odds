import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON wrapper over AsyncStorage. Storage is allowed to fail — a wiped
 * device, a corrupt value — so every read falls back rather than throwing, and
 * writes are best-effort.
 */
export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Losing a preference is not worth surfacing to the user.
  }
}

export const StorageKeys = {
  wheelOptions: 'sfo.wheel.options',
  numberRange: 'sfo.number.range',
  history: 'sfo.history',
} as const;
