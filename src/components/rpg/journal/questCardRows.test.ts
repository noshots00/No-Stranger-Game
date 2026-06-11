import { describe, expect, it } from 'vitest';
import { QUEST_FIRST_NIGHT_ID, QUEST_ORIGIN_ID } from '../constants';
import type { QuestDefinition } from '../quests/types';
import { getQuestCardRows } from './questCardRows';

const origin: QuestDefinition = {
  id: QUEST_ORIGIN_ID,
  title: 'The Beginning',
  briefing: 'Start here.',
  createdAt: 1,
  startStepId: 'start',
  steps: [],
  isAvailable: () => true,
};

const instinct: QuestDefinition = {
  id: QUEST_FIRST_NIGHT_ID,
  title: 'Instinct',
  briefing: 'Survive.',
  createdAt: 2,
  startStepId: 'start',
  steps: [],
  isAvailable: () => true,
};

describe('getQuestCardRows', () => {
  it('keeps completed quests in the card list', () => {
    const rows = getQuestCardRows([origin, instinct], [QUEST_ORIGIN_ID], null);
    expect(rows.map((q) => q.id)).toEqual([QUEST_ORIGIN_ID, QUEST_FIRST_NIGHT_ID]);
  });

  it('includes the active quest when it is missing from visible quests', () => {
    const rows = getQuestCardRows([origin], [], instinct);
    expect(rows.map((q) => q.id)).toEqual([QUEST_FIRST_NIGHT_ID, QUEST_ORIGIN_ID]);
  });
});
