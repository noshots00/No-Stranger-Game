import { describe, expect, it } from 'vitest';
import {
  FEVER_DREAM_PENDING_FLAG,
  QUEST_004_B_THE_DOOR_ID,
  QUEST_DAY_TWO_DREAM_ID,
  QUEST_DYERS_CRYPT_ID,
  QUEST_FIRST_NIGHT_ID,
  QUEST_FOREST_CAVE_ID,
  SWEET_DREAM_PENDING_FLAG,
} from '../constants';
import {
  createInitialQuestState,
  ensureQuestProgress,
  getQuestContext,
  offerNextTrackedForestQuest,
} from './engine';
import { computeNextUnveilIdsAfterCompletion } from './quest-saga';
import {
  DYERS_CRYPT_MUSHROOM_EAT_3_FLAG,
  quest003DyersCrypt,
  resolveDyersCryptInitialStepId,
} from './quest-003-dyers-crypt';
import { resolveDayTwoDreamInitialStepId } from './quest-007-day-two-dream';
import {
  FIRST_NIGHT_FLAG_FOOD,
  FIRST_NIGHT_FLAG_WATER,
} from './quest-002-first-night';
import type { QuestContext } from './types';

const baseContext = (overrides: Partial<QuestContext> = {}): QuestContext => ({
  currentLocation: 'Forest',
  forestSubLocation: null,
  completedQuestIds: [],
  flags: [],
  explorationLevel: 0,
  foragingLevel: 0,
  meleeAttackLevel: 0,
  characterLevel: 0,
  assignedRaceSlug: null,
  lockedClassSlug: null,
  currentDay: 2,
  dayPacingActive: true,
  ...overrides,
});

describe("Dyer's Crypt resolver", () => {
  it('maps Sunset water flag before food', () => {
    const state = createInitialQuestState();
    state.flags = [FIRST_NIGHT_FLAG_FOOD, FIRST_NIGHT_FLAG_WATER];
    expect(resolveDyersCryptInitialStepId(state)).toBe('context-water');
  });

  it('falls back when no Sunset flags', () => {
    expect(resolveDyersCryptInitialStepId(createInitialQuestState())).toBe('context-fallback');
  });
});

describe('resolveQuestEntryStepId', () => {
  it('uses resolver when creating progress', () => {
    const state = { ...createInitialQuestState(), flags: [FIRST_NIGHT_FLAG_WATER] };
    const next = ensureQuestProgress(state, quest003DyersCrypt);
    expect(next.progressByQuestId[QUEST_DYERS_CRYPT_ID]?.currentStepId).toBe('context-water');
  });
});

describe("Dyer's Crypt mushroom loop", () => {
  it('third eat sets eat-3 and fever pending flags on the choice', () => {
    const step = quest003DyersCrypt.steps['dyers-mushroom-hub-2'];
    expect(step.type).toBe('choice');
    if (step.type !== 'choice') return;
    const eat3 = step.choices.find((c) => c.id === 'dyers-eat-more-3');
    expect(eat3?.effects?.flagsSet).toEqual(
      expect.arrayContaining([DYERS_CRYPT_MUSHROOM_EAT_3_FLAG, FEVER_DREAM_PENDING_FLAG])
    );
    const hub3 = quest003DyersCrypt.steps['dyers-mushroom-hub-3'];
    expect(hub3.type).toBe('message');
    if (hub3.type !== 'message') return;
    expect(hub3.nextStepId).toBe('skeleton-intro');
  });
});

describe('Day two dream resolver', () => {
  it('prefers fever intro when fever pending', () => {
    const state = createInitialQuestState();
    state.flags = [FEVER_DREAM_PENDING_FLAG, SWEET_DREAM_PENDING_FLAG];
    expect(resolveDayTwoDreamInitialStepId(state)).toBe('fever-dream-intro');
  });

  it('uses sweet intro when only sweet pending', () => {
    const state = createInitialQuestState();
    state.flags = [SWEET_DREAM_PENDING_FLAG];
    expect(resolveDayTwoDreamInitialStepId(state)).toBe('sweet-dream-intro');
  });
});

describe('manual saga unveil', () => {
  it("unveils Dyer's Crypt after first night, not Old Well", () => {
    const ctx = baseContext({ currentDay: 2, completedQuestIds: [QUEST_FIRST_NIGHT_ID] });
    const ids = computeNextUnveilIdsAfterCompletion(
      QUEST_FIRST_NIGHT_ID,
      [],
      [QUEST_FIRST_NIGHT_ID],
      ctx
    );
    expect(ids).toEqual([QUEST_DYERS_CRYPT_ID]);
    expect(ids).not.toContain('quest-002-b-will-i-starve');
  });

  it('chains crypt → shelter → dream → forest cave', () => {
    const ctxCrypt = baseContext({ currentDay: 2, completedQuestIds: [QUEST_DYERS_CRYPT_ID] });
    expect(
      computeNextUnveilIdsAfterCompletion(
        QUEST_DYERS_CRYPT_ID,
        [],
        [QUEST_DYERS_CRYPT_ID],
        ctxCrypt
      )
    ).toEqual(['quest-004-abandoned-shelter']);
    const ctxShelter = baseContext({
      currentDay: 2,
      completedQuestIds: ['quest-004-abandoned-shelter'],
    });
    expect(
      computeNextUnveilIdsAfterCompletion(
        'quest-004-abandoned-shelter',
        [],
        ['quest-004-abandoned-shelter'],
        ctxShelter
      )
    ).toEqual([QUEST_DAY_TWO_DREAM_ID]);
    const day3 = baseContext({ currentDay: 3, completedQuestIds: [QUEST_DAY_TWO_DREAM_ID] });
    expect(
      computeNextUnveilIdsAfterCompletion(
        QUEST_DAY_TWO_DREAM_ID,
        [],
        [QUEST_DAY_TWO_DREAM_ID],
        day3
      )
    ).toEqual([QUEST_FOREST_CAVE_ID]);
  });

  it('chains forest cave to The Door', () => {
    const ctx = baseContext({ currentDay: 4, completedQuestIds: [QUEST_FOREST_CAVE_ID] });
    expect(
      computeNextUnveilIdsAfterCompletion(
        QUEST_FOREST_CAVE_ID,
        [],
        [QUEST_FOREST_CAVE_ID],
        ctx
      )
    ).toEqual([QUEST_004_B_THE_DOOR_ID]);
  });

  it("auto-starts Abandoned Shelter after Dyer's Crypt while first-night day roll is pending", () => {
    const state = {
      ...createInitialQuestState(),
      flags: ['quest001-complete'],
      unveiledQuestIds: [QUEST_FIRST_NIGHT_ID, QUEST_DYERS_CRYPT_ID],
      activeQuestId: null,
      progressByQuestId: {
        [QUEST_FIRST_NIGHT_ID]: {
          currentStepId: 'q2-end',
          isCompleted: true,
          choiceHistory: [],
        },
        [QUEST_DYERS_CRYPT_ID]: {
          currentStepId: 'skeleton-escaped',
          isCompleted: true,
          choiceHistory: ['skeleton-follow'],
        },
      },
      playDayRollStaging: {
        phase: 'await_continue' as const,
        endingDay: 1,
        nextDay: 2,
        calendarDay: 1,
        sessionOnly: true,
        completedQuestId: QUEST_FIRST_NIGHT_ID,
        prevForReport: {
          modifiers: {},
          skills: { explorationXp: 0, foragingXp: 0, meleeAttackXp: 0 },
          experience: 0,
          flags: [],
          questItems: [],
          dayReportQuestItemsBaseline: [],
        },
      },
    };
    const ctx = getQuestContext(state, 2);
    const unveilAdd = computeNextUnveilIdsAfterCompletion(
      QUEST_DYERS_CRYPT_ID,
      state.unveiledQuestIds,
      [QUEST_FIRST_NIGHT_ID, QUEST_DYERS_CRYPT_ID],
      ctx
    );
    const withUnveils = {
      ...state,
      unveiledQuestIds: Array.from(new Set([...state.unveiledQuestIds, ...unveilAdd])),
    };
    const next = offerNextTrackedForestQuest(withUnveils, getQuestContext(withUnveils, 2));
    expect(unveilAdd).toContain('quest-004-abandoned-shelter');
    expect(next.activeQuestId).toBe('quest-004-abandoned-shelter');
  });
});
