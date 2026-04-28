export interface CreationWeights {
  attributes: Record<string, number>;
  raceProgress: Record<string, number>;
}

export const mergeCreationWeights = (
  current: CreationWeights,
  attributesDelta: Record<string, number>,
  raceDelta: Record<string, number>,
): CreationWeights => {
  const attributes = { ...current.attributes };
  const raceProgress = { ...current.raceProgress };
  for (const [key, delta] of Object.entries(attributesDelta)) {
    attributes[key] = (attributes[key] ?? 0) + delta;
  }
  for (const [key, delta] of Object.entries(raceDelta)) {
    raceProgress[key] = (raceProgress[key] ?? 0) + delta;
  }
  return { attributes, raceProgress };
};

export const resolveRaceReveal = (raceProgress: Record<string, number>, answeredCount: number, minQuestions: number): string | null => {
  const entries = Object.entries(raceProgress).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const [race, score] = entries[0];
  const runnerUp = entries[1]?.[1] ?? 0;
  const lead = score - runnerUp;
  if (answeredCount >= minQuestions && score >= 18 && lead >= 5) return race;
  return null;
};
