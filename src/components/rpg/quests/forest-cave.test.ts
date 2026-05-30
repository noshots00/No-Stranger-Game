import { describe, expect, it } from 'vitest';
import { FIRST_NIGHT_FLAG_TRAILS, FIRST_NIGHT_FLAG_WATER } from './quest-002-first-night';
import { createInitialQuestState } from './engine';
import {
  KNOCKOUT_FOOD,
  KNOCKOUT_GENERIC,
  KNOCKOUT_HIGH_GROUND,
  KNOCKOUT_TRAILS,
  KNOCKOUT_WATER,
  resolveForestCaveInitialStepId,
  resolveForestCavePrimaryKnockoutStepId,
  resolveForestCavePrimaryWakeStepId,
  quest005ForestCave,
} from './quest-005-forest-cave';

describe('Forest Cave resolver', () => {
  it('maps water flag to stream cave opener', () => {
    const state = createInitialQuestState();
    state.flags = [FIRST_NIGHT_FLAG_WATER, FIRST_NIGHT_FLAG_TRAILS];
    expect(resolveForestCaveInitialStepId(state)).toBe('cave-water');
  });

  it('maps trails flag to bear cave opener', () => {
    const state = createInitialQuestState();
    state.flags = [FIRST_NIGHT_FLAG_TRAILS];
    expect(resolveForestCaveInitialStepId(state)).toBe('cave-trails');
  });

  it('resolves primary knockout and wake by flag priority', () => {
    const flags = [FIRST_NIGHT_FLAG_TRAILS, FIRST_NIGHT_FLAG_WATER];
    expect(resolveForestCavePrimaryKnockoutStepId(flags)).toBe(KNOCKOUT_WATER);
    expect(resolveForestCavePrimaryWakeStepId(flags)).toBe('wake-water');
  });

  it('uses generic knockout and wake without primary sunset flags', () => {
    expect(resolveForestCavePrimaryKnockoutStepId([])).toBe(KNOCKOUT_GENERIC);
    expect(resolveForestCavePrimaryWakeStepId([])).toBe('wake-generic');
  });

  it('primary knockout steps lead into the dream bridge', () => {
    for (const stepId of [KNOCKOUT_WATER, KNOCKOUT_TRAILS, KNOCKOUT_FOOD, KNOCKOUT_HIGH_GROUND, KNOCKOUT_GENERIC]) {
      const step = quest005ForestCave.steps[stepId];
      expect(step?.type).toBe('message');
      if (step?.type !== 'message') continue;
      expect(step.nextStepId).toBe('dream-bridge');
    }
  });

  it('chains vignettes through wake route to cave close', () => {
    expect(quest005ForestCave.mainDailyQuest).toBe(true);
    const bridge = quest005ForestCave.steps['dream-bridge'];
    expect(bridge?.type).toBe('message');
    if (bridge?.type === 'message') {
      expect(bridge.nextStepId).toBe('vignette-market-coin');
    }
    const lastVignette = quest005ForestCave.steps['vignette-last-witness'];
    expect(lastVignette?.type).toBe('choice');
    if (lastVignette?.type === 'choice') {
      for (const choice of lastVignette.choices) {
        expect(choice.nextStepId).toBe('wake-route');
      }
    }
    const close = quest005ForestCave.steps['cave-close'];
    expect(close?.type).toBe('message');
    if (close?.type === 'message') {
      expect(close.completeQuest).toBe(true);
    }
  });

  it('openers route to matching knockout steps', () => {
    expect(quest005ForestCave.steps['cave-water']).toMatchObject({
      type: 'message',
      nextStepId: KNOCKOUT_WATER,
    });
    expect(quest005ForestCave.steps['cave-shelter']).toMatchObject({
      type: 'message',
      nextStepId: KNOCKOUT_GENERIC,
    });
  });
});
