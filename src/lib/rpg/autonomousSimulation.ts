import type { MainQuestChoice } from './utils';
import { getAdjacentLocations, resolveEconomy } from './economyModel';
import { INJURY_CATALOG, resolveInjury } from './injuryCatalog';
import { narrateLine } from './narrativeTemplates';
import { createSeededRandom } from './random';
import { normalizeLocationId } from './locations';

export const AUTONOMOUS_SNAPSHOT_KIND = 30315;

export interface AutonomousState {
  locationId: string;
  gold: number;
  health: number;
  professionLabel: string;
  visibleTraits: string[];
  hiddenTraits: string[];
  injuries: string[];
  inventory: Array<{ itemId: string; quantity: number }>;
  shelterType?: 'streets' | 'flophouse' | 'shared' | 'private' | 'home';
  lastSimulatedTick?: string;
  dailyLogs: Array<{ tick: string; line: string }>;
  exploreIntent?: string;
}

const HUNTING_LOOT_TABLE: Array<{ itemId: string; chance: number; min: number; max: number }> = [
  { itemId: 'wolf-hide', chance: 0.25, min: 1, max: 2 },
  { itemId: 'boar-meat', chance: 0.32, min: 1, max: 3 },
  { itemId: 'herb-bundle', chance: 0.4, min: 1, max: 2 },
];

const BASE_WAGE_MULTIPLIER = 2.5;

const SHELTER_COSTS: Record<NonNullable<AutonomousState['shelterType']>, number> = {
  streets: 0,
  flophouse: 5,
  shared: 15,
  private: 30,
  home: 100,
};

export interface SimulationInput {
  characterId: string;
  tickWindowId: string;
  state: AutonomousState;
  choices: MainQuestChoice[];
  professionLocked?: boolean;
}

export interface SimulationOutput {
  state: AutonomousState;
  publicLogLine: string;
}

const maybeRevealTrait = (
  visibleTraits: string[],
  hiddenTraits: string[],
  trait: string | undefined,
  random: () => number,
): { visibleTraits: string[]; hiddenTraits: string[]; line?: string } => {
  if (!trait || visibleTraits.includes(trait)) return { visibleTraits, hiddenTraits };
  if (random() > 0.15) return { visibleTraits, hiddenTraits };
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

export const addDaysToTickId = (tickId: string, days: number): string => {
  const [year, month, day] = tickId.split('-').map((part) => Number(part));
  if (!year || !month || !day) return tickId;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return getCurrentUtcTickId(date.getTime());
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
  professionLocked = true,
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
  const selectedRole = economy.workTable.find((role) =>
    role.role.toLowerCase().includes(state.professionLabel.toLowerCase())
    || state.professionLabel.toLowerCase().includes(role.role.toLowerCase()),
  ) ?? economy.workTable[0];
  const spread = selectedRole.maxIncome - selectedRole.minIncome;
  const roleIncome = selectedRole.minIncome + Math.floor(random() * (spread + 1));
  const baseWage = BASE_WAGE_MULTIPLIER * Math.max(1, roleIncome) * 10;
  const shelterCost = SHELTER_COSTS[state.shelterType ?? 'shared'] ?? 15;
  let hourlyCopper = Math.floor(baseWage / 24);
  if (hourlyCopper * 24 < shelterCost) {
    hourlyCopper = Math.max(hourlyCopper, Math.ceil(shelterCost / 24));
  }
  const baseIncome = hourlyCopper * 24;
  const injuryIncomePenalty = state.injuries
    .map((injuryName) => resolveInjury(injuryName)?.incomeModifier ?? 0)
    .reduce((sum, penalty) => sum + penalty, 0);
  const income = Math.max(-5, baseIncome + injuryIncomePenalty);
  const upkeep = Math.max(economy.baseCostOfLiving, shelterCost) + Math.floor(random() * 2);
  const delta = income - upkeep;

  let nextHealth = state.health;
  const nextInjuries = [...state.injuries];
  if (delta < 0) {
    nextHealth = Math.max(1, nextHealth + delta);
    if (nextHealth < 35 && random() < 0.25) {
      const injury = INJURY_CATALOG[Math.floor(random() * INJURY_CATALOG.length)];
      if (!nextInjuries.includes(injury.label)) nextInjuries.push(injury.label);
    }
  } else {
    nextHealth = Math.min(100, nextHealth + Math.max(1, Math.floor(delta / 2)));
  }

  const healedInjuries = nextInjuries.filter((injuryName) => {
    const def = resolveInjury(injuryName);
    if (!def || def.healChance <= 0) return true;
    return random() >= def.healChance;
  });

  const traitReveal = maybeRevealTrait(
    [...state.visibleTraits],
    [...state.hiddenTraits],
    selectedRole.revealTrait,
    random,
  );

  const publicLogLine = narrateLine(selectedRole.role, economy.label, delta, random);

  let nextLocationId = state.locationId;
  let travelLine: string | undefined;
  if (state.exploreIntent && random() < 0.35) {
    const explicitTravel = state.exploreIntent.match(/Travel to ([a-z0-9_]+)/i)?.[1];
    if (explicitTravel) {
      nextLocationId = normalizeLocationId(explicitTravel);
      travelLine = `You reached ${resolveEconomy(nextLocationId).label}.`;
    }
    const adjacentLocations = getAdjacentLocations(state.locationId);
    if (!explicitTravel && adjacentLocations.length > 0) {
      nextLocationId = adjacentLocations[Math.floor(random() * adjacentLocations.length)];
      travelLine = `You followed the road to ${resolveEconomy(nextLocationId).label}.`;
    }
  }

  const logLines = [
    state.exploreIntent ? `Your exploration paid off: you found signs of ${state.exploreIntent.toLowerCase()}.` : undefined,
    travelLine,
    publicLogLine,
    traitReveal.line,
    nextInjuries.find((injury) => !state.injuries.includes(injury))
      ? resolveInjury(nextInjuries.find((injury) => !state.injuries.includes(injury)) ?? '')?.revealLine
      : undefined,
    healedInjuries.length < nextInjuries.length ? 'One of your old wounds finally eased.' : undefined,
  ].filter((line): line is string => Boolean(line));

  const gainsPerfectShot = Boolean(state.exploreIntent?.includes('Collect 15 Pristine Pelts')) && !traitReveal.visibleTraits.includes('Perfect Shot');
  const nextVisibleTraits = gainsPerfectShot ? [...traitReveal.visibleTraits, 'Perfect Shot'] : traitReveal.visibleTraits;
  if (gainsPerfectShot) {
    logLines.unshift('Quest complete: Collect 15 Pristine Pelts. Trait gained: Perfect Shot (+crit, +pelt quality).');
  }

  const nextInventory = [...state.inventory];
  const likelyHunter = state.professionLabel.toLowerCase().includes('hunt') || state.locationId.includes('forest');
  if (likelyHunter) {
    for (const loot of HUNTING_LOOT_TABLE) {
      if (random() <= loot.chance) {
        const quantity = loot.min + Math.floor(random() * (loot.max - loot.min + 1));
        const index = nextInventory.findIndex((entry) => entry.itemId === loot.itemId);
        if (index >= 0) {
          nextInventory[index] = { ...nextInventory[index], quantity: nextInventory[index].quantity + quantity };
        } else {
          nextInventory.push({ itemId: loot.itemId, quantity });
        }
        logLines.push(`You gathered ${quantity} ${loot.itemId.replace('-', ' ')}.`);
      }
    }
  }

  const nextState: AutonomousState = {
    ...state,
    gold: Math.max(0, state.gold + delta),
    health: nextHealth,
    professionLabel: professionLocked ? state.professionLabel : selectedRole.role,
    visibleTraits: nextVisibleTraits,
    hiddenTraits: traitReveal.hiddenTraits,
    locationId: nextLocationId,
    injuries: healedInjuries,
    inventory: nextInventory,
    shelterType: state.shelterType ?? 'shared',
    lastSimulatedTick: tickWindowId,
    dailyLogs: [...logLines.map((line) => ({ tick: tickWindowId, line })), ...state.dailyLogs].slice(0, 40),
    exploreIntent: undefined,
  };

  return { state: nextState, publicLogLine };
};
