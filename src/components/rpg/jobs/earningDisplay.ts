import { formatResourceLabel } from '../helpers';
import { getLevelFromXp } from '../quests/engine';
import type { QuestState } from '../quests/types';
import { getJobDefinition } from './registry';
import type { JobDefinition } from './types';

export const JOB_DAILY_YIELD_MIN_RATIO = 0.7;
export const JOB_DAILY_YIELD_MAX_RATIO = 1.2;

export function computeDailyYieldRange(baseAmount: number): { min: number; max: number } {
  const base = Math.max(0, Math.floor(baseAmount));
  if (base <= 0) return { min: 0, max: 0 };
  return {
    min: Math.max(1, Math.floor(base * JOB_DAILY_YIELD_MIN_RATIO)),
    max: Math.max(1, Math.ceil(base * JOB_DAILY_YIELD_MAX_RATIO)),
  };
}

export function getJobProfessionLevel(job: JobDefinition, skills: QuestState['skills']): number {
  if (!job.skillXpKey) return 1;
  const xp = skills[job.skillXpKey];
  return Math.max(1, getLevelFromXp(xp));
}

function formatAmountRange(min: number, max: number): string {
  if (min <= 0 && max <= 0) return '0';
  if (min === max) return String(min);
  return `${min}-${max}`;
}

/** One earning line, e.g. `7-12 stone/day`. */
export function formatJobResourceEarningLine(args: {
  baseAmount: number;
  resourceKey: string;
}): string {
  const { min, max } = computeDailyYieldRange(args.baseAmount);
  const resource = formatResourceLabel(args.resourceKey).toLowerCase();
  const amount = formatAmountRange(min, max);
  return `${amount} ${resource}/day`;
}

const SKILL_XP_LABEL: Record<NonNullable<JobDefinition['skillXpKey']>, string> = {
  explorationXp: 'exploration',
  foragingXp: 'foraging',
  meleeAttackXp: 'melee',
};

function formatJobSkillXpEarningLine(job: JobDefinition): string | null {
  if (!job.skillXpKey || !job.skillXpAmount || job.skillXpAmount <= 0) return null;
  const skill = SKILL_XP_LABEL[job.skillXpKey];
  return `${job.skillXpAmount} ${skill} XP/day`;
}

/** Human-readable earning lines for the journal active-state card. */
export function buildJobEarningLines(jobSlug: string, skills: QuestState['skills']): string[] {
  const job = getJobDefinition(jobSlug);
  if (!job) return [];

  const lines: string[] = [];

  for (const [resourceKey, baseAmount] of Object.entries(job.dailyYields)) {
    if (typeof baseAmount !== 'number' || baseAmount <= 0) continue;
    lines.push(
      formatJobResourceEarningLine({
        baseAmount,
        resourceKey,
      })
    );
  }

  const skillLine = formatJobSkillXpEarningLine(job);
  if (skillLine && lines.length === 0) lines.push(skillLine);

  return lines;
}

export function formatNextDayCountdownLine(dayCounter: number, remainingMs: number): string {
  const totalMinutes = Math.max(0, Math.floor(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `Day ${dayCounter + 1} starts in ${hh}:${mm}`;
}

/** Live countdown for the active-state banner corner — `Day 10 in 2 hours and 05:43`. */
export function formatNextDayCountdownCorner(dayCounter: number, remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hourLabel = hours === 1 ? 'hour' : 'hours';
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `Day ${dayCounter + 1} in ${hours} ${hourLabel} and ${mm}:${ss}`;
}
