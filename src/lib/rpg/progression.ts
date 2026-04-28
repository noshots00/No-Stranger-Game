import type { AutonomousState } from './autonomousSimulation';

export interface ProgressionResult {
  xpGain: number;
  levelUp: boolean;
  nextLevel: number;
  hourlyXp: number;
  logLine?: string;
}

export const getLevelFromXp = (xp: number): number => {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1);
};

export const computeDailyXpGain = (state: AutonomousState, incomeDelta: number): number => {
  let base = 4;
  if (incomeDelta > 0) base += Math.min(8, incomeDelta);
  if (state.injuries.length > 0) base += 1;
  if (state.exploreIntent) base += 2;
  return base;
};

export const applyProgression = (currentXp: number, state: AutonomousState, incomeDelta: number): ProgressionResult => {
  const xpGain = computeDailyXpGain(state, incomeDelta);
  const prevLevel = getLevelFromXp(currentXp);
  const nextXp = currentXp + xpGain;
  const nextLevel = getLevelFromXp(nextXp);
  const levelUp = nextLevel > prevLevel;
  return {
    xpGain,
    levelUp,
    nextLevel,
    hourlyXp: Math.max(1, Math.floor((nextXp / 24) + (nextLevel * 1.2))),
    logLine: levelUp ? `You feel yourself changing. Level ${nextLevel}.` : undefined,
  };
};
