import { describe, expect, it } from 'vitest';
import { FIRST_NIGHT_FLAG_TRAILS, FIRST_NIGHT_FLAG_WATER } from './quest-002-first-night';
import { createInitialQuestState } from './engine';
import { resolveForestCaveInitialStepId, quest005ForestCave } from './quest-005-forest-cave';

describe('Forest Cave resolver', () => {
  it('maps water flag to stream cave', () => {
    const state = createInitialQuestState();
    state.flags = [FIRST_NIGHT_FLAG_WATER, FIRST_NIGHT_FLAG_TRAILS];
    expect(resolveForestCaveInitialStepId(state)).toBe('cave-water');
  });

  it('maps trails flag to bear cave', () => {
    const state = createInitialQuestState();
    state.flags = [FIRST_NIGHT_FLAG_TRAILS];
    expect(resolveForestCaveInitialStepId(state)).toBe('cave-trails');
  });

  it('every context path leads into the cave', () => {
    for (const stepId of [
      'cave-water',
      'cave-trails',
      'cave-food',
      'cave-high-ground',
      'cave-shelter',
      'cave-tree',
      'cave-pockets',
      'cave-call-help',
      'cave-fallback',
    ]) {
      const step = quest005ForestCave.steps[stepId];
      expect(step?.type).toBe('message');
      if (step?.type !== 'message') continue;
      expect(step.nextStepId).toBe('cave-enter');
    }
    const enter = quest005ForestCave.steps['cave-enter'];
    expect(enter?.type).toBe('message');
    if (enter?.type === 'message') {
      expect(enter.completeQuest).toBe(true);
    }
  });
});
