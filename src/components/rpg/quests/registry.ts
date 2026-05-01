import { quest001Origin } from './quest-001-origin';
import { quest002BoarAmbush } from './quest-002-boar-ambush';
import { quest003SilverLake } from './quest-003-silver-lake';
import { quest004AbandonedShelter } from './quest-004-abandoned-shelter';
import { quest005Airship } from './quest-005-airship';
import { quest006WanderingSkeleton } from './quest-006-wandering-skeleton';
import { quest007GreenHand } from './quest-007-green-hand';
import { quest008WolfAttack } from './quest-008-wolf-attack';
import { quest009Waterfall } from './quest-009-waterfall';
import { quest010FindEarring } from './quest-010-find-earring';
import { quest011FindBracelet } from './quest-011-find-bracelet';
import { quest012FindShoe } from './quest-012-find-shoe';
import { quest013FindHat } from './quest-013-find-hat';
import type { QuestDefinition } from './types';

export const allQuests: QuestDefinition[] = [
  quest001Origin,
  quest002BoarAmbush,
  quest003SilverLake,
  quest004AbandonedShelter,
  quest005Airship,
  quest006WanderingSkeleton,
  quest007GreenHand,
  quest008WolfAttack,
  quest009Waterfall,
  quest010FindEarring,
  quest011FindBracelet,
  quest012FindShoe,
  quest013FindHat,
];

export const questById: Record<string, QuestDefinition> = allQuests.reduce<Record<string, QuestDefinition>>(
  (acc, quest) => {
    acc[quest.id] = quest;
    return acc;
  },
  {}
);
