import { quest001Origin } from './quest-001-origin';
import { quest002BoarAmbush } from './quest-002-boar-ambush';
import { quest003SilverLake } from './quest-003-silver-lake';
import type { QuestDefinition } from './types';

export const allQuests: QuestDefinition[] = [quest001Origin, quest002BoarAmbush, quest003SilverLake];

export const questById: Record<string, QuestDefinition> = allQuests.reduce<Record<string, QuestDefinition>>(
  (acc, quest) => {
    acc[quest.id] = quest;
    return acc;
  },
  {}
);
