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
import { quest014MushroomPatch } from './quest-014-mushroom-patch';
import { quest015FeverDream } from './quest-015-fever-dream';
import { quest016SweetDream } from './quest-016-sweet-dream';
import { quest017SilverLakeShore } from './quest-017-silver-lake-shore';
import { quest018SilverLakeReflection } from './quest-018-silver-lake-reflection';
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
  quest014MushroomPatch,
  quest015FeverDream,
  quest016SweetDream,
  quest017SilverLakeShore,
  quest018SilverLakeReflection,
];

export const questById: Record<string, QuestDefinition> = allQuests.reduce<Record<string, QuestDefinition>>(
  (acc, quest) => {
    acc[quest.id] = quest;
    return acc;
  },
  {}
);
