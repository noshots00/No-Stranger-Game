import { describe, expect, it } from 'vitest';
import { createInitialQuestState } from '@/components/rpg/quests/engine';
import { recordModifiersAfterQuestComplete } from '@/components/rpg/quests/engine';
import { QUEST_FIRST_NIGHT_ID } from '@/components/rpg/constants';
import { devRestartFromQuest } from './devStoryCheckpoints';
import { quest001Origin } from '@/components/rpg/quests/quest-001-origin';
import { quest002FirstNight } from '@/components/rpg/quests/quest-002-first-night';

const questById = {
  [quest001Origin.id]: quest001Origin,
  [quest002FirstNight.id]: quest002FirstNight,
};

const orderedIds = [quest001Origin.id, QUEST_FIRST_NIGHT_ID];

describe('devRestartFromQuest', () => {
  it('removes modifiers gained from a replayed quest', () => {
    let state = createInitialQuestState();
    state = recordModifiersAfterQuestComplete(state, quest001Origin.id);
    state = {
      ...state,
      modifiers: { 'stat:intelligence': 2, 'class:mage': 3 },
      modifiersAfterQuestComplete: {
        ...state.modifiersAfterQuestComplete,
        [QUEST_FIRST_NIGHT_ID]: { 'stat:intelligence': 2, 'class:mage': 3 },
      },
      progressByQuestId: {
        [quest001Origin.id]: {
          currentStepId: 'done',
          isCompleted: true,
          choiceHistory: [],
        },
        [QUEST_FIRST_NIGHT_ID]: {
          currentStepId: 'done',
          isCompleted: true,
          choiceHistory: [],
          modifiersAtQuestOpen: {},
        },
      },
    };

    const restarted = devRestartFromQuest(state, QUEST_FIRST_NIGHT_ID, questById, orderedIds);

    expect(restarted.modifiers['stat:intelligence']).toBeUndefined();
    expect(restarted.modifiers['class:mage']).toBeUndefined();
    expect(restarted.progressByQuestId[QUEST_FIRST_NIGHT_ID]?.isCompleted).toBe(false);
    expect(restarted.modifiersAfterQuestComplete?.[QUEST_FIRST_NIGHT_ID]).toBeUndefined();
  });
});
