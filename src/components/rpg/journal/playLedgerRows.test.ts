import { describe, expect, it } from 'vitest';
import type { ChronicleSegment } from '../dialogueFormat';
import { QUEST_FIRST_NIGHT_ID, QUEST_ORIGIN_ID } from '../constants';
import type { QuestDefinition } from '../quests/types';
import { buildPlayLedgerRows } from './playLedgerRows';

const originQuest: QuestDefinition = {
  id: QUEST_ORIGIN_ID,
  title: 'The Beginning',
  briefing: 'Start.',
  createdAt: 1,
  startStepId: 'start',
  steps: [],
  isAvailable: () => true,
};

const instinctQuest: QuestDefinition = {
  id: QUEST_FIRST_NIGHT_ID,
  title: 'Instinct',
  briefing: 'Survive.',
  createdAt: 2,
  startStepId: 'start',
  steps: [],
  isAvailable: () => true,
};

function characterSegment(
  id: string,
  text: string,
  atMs: number,
  sourceQuestId?: string
): ChronicleSegment {
  return {
    type: 'dialogueBlock',
    role: 'character_update',
    lines: [
      {
        id,
        text,
        atMs,
        speaker: 'CharacterUpdate',
        ...(sourceQuestId ? { sourceQuestId } : {}),
      },
    ],
  };
}

/** Simulates groupChronicleRows merging unlike quests into one block (the production bug). */
function mergedCrossQuestBlock(): ChronicleSegment {
  return {
    type: 'dialogueBlock',
    role: 'character_update',
    lines: [
      {
        id: 'name',
        text: 'Your name is Nad.',
        atMs: 50,
        speaker: 'CharacterUpdate',
        sourceQuestId: QUEST_ORIGIN_ID,
      },
      {
        id: 'spark',
        text: 'You learned Spark!',
        atMs: 200,
        speaker: 'CharacterUpdate',
        sourceQuestId: QUEST_FIRST_NIGHT_ID,
      },
    ],
  };
}

describe('buildPlayLedgerRows', () => {
  it('keeps quest 1 prints in the quest 1 slot below its card', () => {
    const originOpenedAt = 100;
    const { interleaved } = buildPlayLedgerRows(
      [
        characterSegment('name', 'Your name is Nad.', 50, QUEST_ORIGIN_ID),
        characterSegment('lvl1', 'You reached Level 1!', 60, QUEST_ORIGIN_ID),
      ],
      [originQuest],
      { [QUEST_ORIGIN_ID]: originOpenedAt }
    );

    expect(interleaved).toHaveLength(1);
    expect(interleaved[0]).toMatchObject({
      kind: 'quest_slot',
      questId: QUEST_ORIGIN_ID,
      sortMs: originOpenedAt,
    });
    expect(interleaved[0].kind === 'quest_slot' && interleaved[0].prints).toHaveLength(2);
  });

  it('routes quest 2 prints into the quest 2 slot even when chronicle merged them with quest 1', () => {
    const originOpenedAt = 100;
    const instinctOpenedAt = 500;
    const { interleaved } = buildPlayLedgerRows(
      [mergedCrossQuestBlock()],
      [originQuest, instinctQuest],
      {
        [QUEST_ORIGIN_ID]: originOpenedAt,
        [QUEST_FIRST_NIGHT_ID]: instinctOpenedAt,
      }
    );

    expect(interleaved.map((row) => row.kind)).toEqual(['quest_slot', 'quest_slot']);
    const q1 = interleaved[0];
    const q2 = interleaved[1];
    expect(q1.kind === 'quest_slot' && q1.questId).toBe(QUEST_ORIGIN_ID);
    expect(q2.kind === 'quest_slot' && q2.questId).toBe(QUEST_FIRST_NIGHT_ID);
    expect(q1.kind === 'quest_slot' && q1.prints[0]?.lines[0]?.text).toBe('Your name is Nad.');
    expect(q2.kind === 'quest_slot' && q2.prints[0]?.lines[0]?.text).toBe('You learned Spark!');
  });

  it('interleaves global prints chronologically between quest slots', () => {
    const originOpenedAt = 100;
    const instinctOpenedAt = 500;
    const { interleaved } = buildPlayLedgerRows(
      [
        characterSegment('name', 'Your name is Nad.', 50, QUEST_ORIGIN_ID),
        {
          type: 'world',
          row: { atMs: 300, text: 'A crow calls.' },
        },
        characterSegment('spark', 'You learned Spark!', 200, QUEST_FIRST_NIGHT_ID),
      ],
      [originQuest, instinctQuest],
      {
        [QUEST_ORIGIN_ID]: originOpenedAt,
        [QUEST_FIRST_NIGHT_ID]: instinctOpenedAt,
      }
    );

    expect(interleaved.map((row) => row.kind)).toEqual(['quest_slot', 'global', 'quest_slot']);
    expect(interleaved[1].kind === 'global' && interleaved[1].sortMs).toBe(300);
  });

  it('lists unopened visible quests separately', () => {
    const { interleaved, unopenedQuestIds } = buildPlayLedgerRows([], [originQuest, instinctQuest], {});
    expect(interleaved).toEqual([]);
    expect(unopenedQuestIds).toEqual([QUEST_ORIGIN_ID, QUEST_FIRST_NIGHT_ID]);
  });
});
