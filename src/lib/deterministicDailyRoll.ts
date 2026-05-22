/** Deterministic 0..1 roll from in-game day (shared by daily pacing and tavern wolf hides). */
export function getDeterministicDailyRoll(day: number, seedOffset = 0): number {
  const x = Math.sin(day * 12.9898 + 78.233 + seedOffset * 17.719) * 43758.5453;
  return x - Math.floor(x);
}
