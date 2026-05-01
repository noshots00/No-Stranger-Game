import { quest001Origin } from './quest-001-origin';
import { quest002BoarAmbush } from './quest-002-boar-ambush';
import { quest003SilverLake } from './quest-003-silver-lake';
import { quest004AbandonedShelter } from './quest-004-abandoned-shelter';
import { quest005Airship } from './quest-005-airship';
import type { QuestDefinition } from './types';

export const allQuests: QuestDefinition[] = [
  quest001Origin,
  quest002BoarAmbush,
  quest003SilverLake,
  quest004AbandonedShelter,
  quest005Airship,
];

export const questById: Record<string, QuestDefinition> = allQuests.reduce<Record<string, QuestDefinition>>(
  (acc, quest) => {
    acc[quest.id] = quest;
    return acc;
  },
  {}
);
