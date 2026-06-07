import {
  JOB_SLUG_ADVENTURER,
  JOB_SLUG_EXPLORER,
  JOB_SLUG_MINER,
  JOB_SLUG_STONECUTTER,
  JOB_SLUG_WOODCUTTER,
  RESOURCE_ADVENTURES,
  RESOURCE_COPPER_ORE,
  RESOURCE_LOGS,
  RESOURCE_STONE,
} from '../constants';
import type { JobDefinition } from './types';

export const JOB_REGISTRY: Record<string, JobDefinition> = {
  [JOB_SLUG_EXPLORER]: {
    slug: JOB_SLUG_EXPLORER,
    displayName: 'Explorer',
    description: 'Scout the forest fringe for paths the village has forgotten.',
    hallLabel: "Explorer's post",
    dailyYields: {},
    skillXpKey: 'explorationXp',
    skillXpAmount: 120,
  },
  [JOB_SLUG_ADVENTURER]: {
    slug: JOB_SLUG_ADVENTURER,
    displayName: 'Adventurer',
    description: 'Clear crypt floors and drag trophies back to the guild.',
    hallLabel: "Adventurer's Guild",
    linkedLocation: 'Cemetery',
    dailyYields: { [RESOURCE_ADVENTURES]: 2 },
    skillXpKey: 'meleeAttackXp',
    skillXpAmount: 150,
  },
  [JOB_SLUG_STONECUTTER]: {
    slug: JOB_SLUG_STONECUTTER,
    displayName: 'Stone Cutter',
    description: 'Work the quarry face for building stone.',
    hallLabel: "Mason's Yard",
    linkedLocation: 'Quarry',
    dailyYields: { [RESOURCE_STONE]: 10 },
    skillXpKey: 'foragingXp',
    skillXpAmount: 100,
  },
  [JOB_SLUG_MINER]: {
    slug: JOB_SLUG_MINER,
    displayName: 'Miner',
    description: 'Descend the mine for copper ore and rare finds.',
    hallLabel: "Miners' Union Hall",
    linkedLocation: 'Mine',
    dailyYields: { [RESOURCE_COPPER_ORE]: 10 },
    skillXpKey: 'foragingXp',
    skillXpAmount: 120,
  },
  [JOB_SLUG_WOODCUTTER]: {
    slug: JOB_SLUG_WOODCUTTER,
    displayName: 'Woodcutter',
    description: 'Fell timber for village construction.',
    hallLabel: "Woodcutter's Camp",
    dailyYields: { [RESOURCE_LOGS]: 10 },
    skillXpKey: 'foragingXp',
    skillXpAmount: 100,
  },
};

export function getJobDefinition(slug: string): JobDefinition | undefined {
  return JOB_REGISTRY[slug];
}

/** Play/journal print when the player chooses a Jobs Hall profession. */
export function formatProfessionChoicePrint(job: JobDefinition): string {
  return `You took on the profession of ${job.displayName.toLowerCase()}.`;
}
