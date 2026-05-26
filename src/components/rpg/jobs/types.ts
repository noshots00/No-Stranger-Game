import type { JobSlug } from '../constants';

export type JobDefinition = {
  slug: JobSlug;
  displayName: string;
  description: string;
  /** Village NPC / hall label for switching. */
  hallLabel: string;
  /** Forest sub-location tied to this job, if any. */
  linkedLocation?: string;
  /** Resource yields per daily action. */
  dailyYields: Partial<Record<string, number>>;
  /** Skill XP key to grant on daily action. */
  skillXpKey?: 'explorationXp' | 'foragingXp' | 'meleeAttackXp';
  skillXpAmount?: number;
};

export type JobActionResult = {
  state: import('../quests/types').QuestState;
  worldLines: string[];
  /** Quest id to unveil after explorer action, if any. */
  unveilQuestId?: string;
};
