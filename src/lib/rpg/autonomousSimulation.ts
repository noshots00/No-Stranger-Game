import type { MainQuestChoice } from './utils';
import { resolveEconomy } from './economyModel';

export const AUTONOMOUS_SNAPSHOT_KIND = 30315;

export interface AutonomousState {
  locationId: string;
  gold: number;
  health: number;
  professionLabel: string;
  visibleTraits: string[];
  hiddenTraits: string[];
  injuries: string[];
  lastSimulatedTick?: string;
  dailyLogs: Array<{ tick: string; line: string }>;
  exploreIntent?: string;
}

export interface SimulationInput {
  characterId: string;
  tickWindowId: string;
  state: AutonomousState;
  choices: MainQuestChoice[];
}

export interface SimulationOutput {
  state: AutonomousState;
  publicLogLine: string;
}

const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seedSource: string): (() => number) => {
  let state = hashString(seedSource);
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
};

const maybeRevealTrait = (
  visibleTraits: string[],
  hiddenTraits: string[],
  trait: string | undefined,
  random: () => number,
): { visibleTraits: string[]; hiddenTraits: string[]; line?: string } => {
  if (!trait || visibleTraits.includes(trait)) return { visibleTraits, hiddenTraits };
  if (random() > 0.32) return { visibleTraits, hiddenTraits };
  return {
    visibleTraits: [...visibleTraits, trait],
    hiddenTraits: hiddenTraits.filter((item) => item !== trait),
    line: `A pattern surfaced: ${trait}.`,
  };
};

export const getCurrentUtcTickId = (nowMs: number = Date.now()): string => {
  const now = new Date(nowMs);
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const shouldSimulateTick = (
  state: AutonomousState,
  tickWindowId: string,
): boolean => state.lastSimulatedTick !== tickWindowId;

export const simulateAutonomousDay = ({
  characterId,
  tickWindowId,
  state,
  choices,
}: SimulationInput): SimulationOutput => {
  const random = createSeededRandom([
    characterId,
    tickWindowId,
    state.locationId,
    state.professionLabel,
    choices.slice(-3).map((choice) => `${choice.questId}:${choice.option}`).join('|'),
    state.exploreIntent ?? 'none',
  ].join('::'));

  const economy = resolveEconomy(state.locationId);
  const roleIndex = Math.floor(random() * economy.workTable.length);
  const selectedRole = economy.workTable[roleIndex];
  const spread = selectedRole.maxIncome - selectedRole.minIncome;
  const income = selectedRole.minIncome + Math.floor(random() * (spread + 1));
  const upkeep = economy.baseCostOfLiving + Math.floor(random() * 2);
  const delta = income - upkeep;

  let nextHealth = state.health;
  const nextInjuries = [...state.injuries];
  if (delta < 0) {
    nextHealth = Math.max(0, nextHealth + delta);
    if (nextHealth < 35 && !nextInjuries.includes('Old Leg Pain') && random() < 0.25) {
      nextInjuries.push('Old Leg Pain');
    }
  } else {
    nextHealth = Math.min(100, nextHealth + Math.max(1, Math.floor(delta / 2)));
  }

  const traitReveal = maybeRevealTrait(
    [...state.visibleTraits],
    [...state.hiddenTraits],
    selectedRole.revealTrait,
    random,
  );

  const publicLogLine = delta >= 0
    ? `At ${economy.label}, you worked as ${selectedRole.role}. You kept ${delta} copper after shelter and food.`
    : `At ${economy.label}, ${selectedRole.role} paid poorly. You fell short by ${Math.abs(delta)} copper.`;

  const logLines = [
    publicLogLine,
    traitReveal.line,
    nextInjuries.includes('Old Leg Pain') && !state.injuries.includes('Old Leg Pain')
      ? 'You wake with a deep ache in your leg. An old injury reveals itself.'
      : undefined,
  ].filter((line): line is string => Boolean(line));

  const nextState: AutonomousState = {
    ...state,
    gold: Math.max(0, state.gold + delta),
    health: nextHealth,
    professionLabel: selectedRole.role,
    visibleTraits: traitReveal.visibleTraits,
    hiddenTraits: traitReveal.hiddenTraits,
    injuries: nextInjuries,
    lastSimulatedTick: tickWindowId,
    dailyLogs: [...logLines.map((line) => ({ tick: tickWindowId, line })), ...state.dailyLogs].slice(0, 40),
    exploreIntent: undefined,
  };

  return { state: nextState, publicLogLine };
};
