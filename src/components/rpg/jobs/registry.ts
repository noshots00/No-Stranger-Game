import {
  JOB_SLUG_ADVENTURER,
  JOB_SLUG_EXPLORER,
  JOB_SLUG_MINER,
  JOB_SLUG_STONECUTTER,
  RESOURCE_IRON,
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
    dailyYields: { [RESOURCE_IRON]: 2 },
    skillXpKey: 'meleeAttackXp',
    skillXpAmount: 150,
  },
  [JOB_SLUG_STONECUTTER]: {
    slug: JOB_SLUG_STONECUTTER,
    displayName: 'Stone Cutter',
    description: 'Work the quarry face for building stone.',
    hallLabel: "Mason's Yard",
    linkedLocation: 'Quarry',
    dailyYields: { [RESOURCE_STONE]: 5 },
    skillXpKey: 'foragingXp',
    skillXpAmount: 100,
  },
  [JOB_SLUG_MINER]: {
    slug: JOB_SLUG_MINER,
    displayName: 'Miner',
    description: 'Descend the mine for iron and rare ore.',
    hallLabel: "Miners' Union Hall",
    linkedLocation: 'Mine',
    dailyYields: { [RESOURCE_IRON]: 4 },
    skillXpKey: 'foragingXp',
    skillXpAmount: 120,
  },
};

export function getJobDefinition(slug: string): JobDefinition | undefined {
  return JOB_REGISTRY[slug];
}
