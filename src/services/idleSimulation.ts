import { getEstDayId } from '@/utils/time';

export interface SimulationContext {
  profession: string;
  location: string;
  shelter: string;
  traits: string[];
  hourlyCopper: number;
  hourlyXp: number;
  lastSimTime: number;
  day: number;
  health: number;
  maxHealth: number;
}

export interface SimulationResult {
  copperEarned: number;
  xpEarned: number;
  healthDelta: number;
  day: number;
  lastSimTime: number;
  logs: string[];
  newHourlyCopper: number;
  newHourlyXp: number;
}

const BASE_WAGES: Record<string, number> = {
  Peasant: 24,
  Forager: 32,
  Woodcutter: 38,
  Hunter: 45,
  Miner: 42,
  Blacksmith: 50,
  Weaver: 36,
  Cook: 34,
};

const BASE_XP: Record<string, number> = {
  Peasant: 12,
  Forager: 16,
  Woodcutter: 18,
  Hunter: 20,
  Miner: 19,
  Blacksmith: 24,
  Weaver: 15,
  Cook: 16,
};

const SHELTER_COSTS: Record<string, number> = {
  Streets: 0,
  Flophouse: 5,
  SharedRoom: 15,
  PrivateRoom: 30,
  OwnHome: 100,
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function runSimulation(ctx: SimulationContext): SimulationResult {
  const nowTs = Date.now();
  const lastSim = new Date(ctx.lastSimTime);
  const elapsedMs = nowTs - lastSim.getTime();

  if (elapsedMs <= 0 || Number.isNaN(ctx.lastSimTime)) {
    return {
      copperEarned: 0,
      xpEarned: 0,
      healthDelta: 0,
      day: ctx.day,
      lastSimTime: nowTs,
      logs: [],
      newHourlyCopper: ctx.hourlyCopper,
      newHourlyXp: ctx.hourlyXp,
    };
  }

  const hoursElapsed = Math.min(24, elapsedMs / 3_600_000);
  const dayDelta = getEstDayId(nowTs) === getEstDayId(ctx.lastSimTime) ? 0 : Math.max(1, Math.floor(elapsedMs / 86_400_000));
  const crossedMidnight = dayDelta > 0;
  const baseWage = BASE_WAGES[ctx.profession] ?? BASE_WAGES.Peasant;
  const baseXp = BASE_XP[ctx.profession] ?? BASE_XP.Peasant;
  const wageMult =
    (ctx.traits.includes('Hard Worker') ? 1.15 : 1) *
    (ctx.traits.includes('Lazy') ? 0.85 : 1) *
    (ctx.location === 'Village' ? 1 : 1.1);
  const hourlyCopper = Math.floor((baseWage * wageMult) / 24);
  const hourlyXp = Math.floor(baseXp / 24);
  const minHourly = Math.max(1, Math.ceil((SHELTER_COSTS[ctx.shelter] ?? 5) / 24));
  const effectiveHourlyCopper = Math.max(hourlyCopper, minHourly);

  let copperEarned = Math.floor(effectiveHourlyCopper * hoursElapsed);
  let xpEarned = Math.floor(hourlyXp * hoursElapsed);
  let healthDelta = 0;
  const logs: string[] = [];

  if (crossedMidnight) {
    const shelterCost = SHELTER_COSTS[ctx.shelter] ?? 5;
    const totalShelterCost = shelterCost * dayDelta;
    const netDaily = copperEarned - totalShelterCost;
    if (netDaily < 0) {
      copperEarned = totalShelterCost;
      logs.push(`Survival stipend covered ${totalShelterCost}c shelter cost.`);
    } else {
      copperEarned = netDaily;
      logs.push(`Paid ${totalShelterCost}c for ${ctx.shelter}.`);
    }
    healthDelta = 5 * dayDelta;
    logs.push(dayDelta > 1 ? `${dayDelta} days pass. You wake refreshed.` : 'A new day dawns. You wake refreshed.');
  }

  const roll = seededRandom(nowTs + ctx.hourlyCopper * 100);
  if (roll > 0.85 && ctx.traits.includes('Curious')) logs.push('You noticed something unusual while working.');
  if (ctx.traits.includes('Night Owl') && new Date(nowTs).getHours() < 6) {
    logs.push('Worked through the quiet hours. +3% yield.');
    xpEarned += 2;
  }

  return {
    copperEarned,
    xpEarned,
    healthDelta,
    day: crossedMidnight ? ctx.day + dayDelta : ctx.day,
    lastSimTime: nowTs,
    logs,
    newHourlyCopper: effectiveHourlyCopper,
    newHourlyXp: hourlyXp,
  };
}
