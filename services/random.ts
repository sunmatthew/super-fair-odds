/** Uniform integer in [min, max], both inclusive. */
export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Uniformly picks one element. Returns undefined for an empty list. */
export function pickOne<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[randomInt(0, items.length - 1)];
}

/** Fisher-Yates. Returns a new array; does not mutate the input. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** True half the time. */
export function coinToss(): boolean {
  return Math.random() < 0.5;
}
