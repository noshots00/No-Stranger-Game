import { describe, expect, it } from 'vitest';

import { createInitialQuestState } from '../quests/engine';
import {
  acceptWolfHidesQuest,
  cancelWolfHidesQuest,
  isWolfHidesDailyActive,
} from './wolfHidesDaily';
import { WOLF_HIDES_DAILY_FLAG } from './constants';

describe('wolfHidesDaily', () => {
  it('accept adds the daily flag', () => {
    const next = acceptWolfHidesQuest(createInitialQuestState());
    expect(isWolfHidesDailyActive(next)).toBe(true);
    expect(next.flags).toContain(WOLF_HIDES_DAILY_FLAG);
  });

  it('cancel removes the daily flag', () => {
    const active = acceptWolfHidesQuest(createInitialQuestState());
    const next = cancelWolfHidesQuest(active);
    expect(isWolfHidesDailyActive(next)).toBe(false);
    expect(next.flags).not.toContain(WOLF_HIDES_DAILY_FLAG);
  });
});
