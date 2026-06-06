import { describe, expect, it, beforeEach } from 'vitest';

import { createInitialQuestState } from './engine';
import { QUEST_DYERS_CRYPT_ID, QUEST_VILLAGE_ARRIVAL_ID } from '../constants';
import {
  canPersistQuestCheckpoint,
  hasNamedCharacter,
  isEstablishedQuestSave,
  wouldClobberEstablishedLocalSave,
} from './questSaveGuard';

describe('questSaveGuard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('treats fresh origin stub as not established', () => {
    expect(isEstablishedQuestSave(createInitialQuestState())).toBe(false);
    expect(hasNamedCharacter(createInitialQuestState())).toBe(false);
    expect(canPersistQuestCheckpoint(createInitialQuestState())).toBe(false);
  });

  it('allows checkpoints only after naming', () => {
    const named = { ...createInitialQuestState(), playerName: 'Aldric' };
    expect(canPersistQuestCheckpoint(named)).toBe(true);

    const dated = {
      ...createInitialQuestState(),
      characterCreationDateEastern: '2026-05-01',
    };
    expect(canPersistQuestCheckpoint(dated)).toBe(true);
  });

  it('treats named or progressed saves as established', () => {
    const named = { ...createInitialQuestState(), playerName: 'Aldric' };
    expect(isEstablishedQuestSave(named)).toBe(true);

    const progressed = {
      ...createInitialQuestState(),
      progressByQuestId: {
        [QUEST_DYERS_CRYPT_ID]: {
          currentStepId: 'dyers-intro',
          isCompleted: false,
          choiceHistory: [],
        },
      },
    };
    expect(isEstablishedQuestSave(progressed)).toBe(true);
  });

  it('blocks blank state from overwriting richer localStorage', () => {
    const key = 'nsg:quest-state:test';
    const local = {
      ...createInitialQuestState(),
      playerName: 'Aldric',
      flags: ['village-phase'],
      progressByQuestId: {
        [QUEST_VILLAGE_ARRIVAL_ID]: {
          currentStepId: 'village-arrival',
          isCompleted: true,
          choiceHistory: [],
        },
      },
    };
    localStorage.setItem(key, JSON.stringify(local));

    expect(wouldClobberEstablishedLocalSave(key, createInitialQuestState())).toBe(true);
    expect(wouldClobberEstablishedLocalSave(key, local)).toBe(false);
  });
});
