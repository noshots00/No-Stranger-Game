import { describe, expect, it } from 'vitest';
import { SEVERE_INJURY_MAGNITUDE, WOUNDED_SHOULDER_INJURY_KEY } from '../constants';
import { formatInjurySheetLine } from '../helpers';
import { applyChoice, applyHealthFromChoiceEffect, createInitialQuestState } from './engine';
import { quest003DyersCrypt } from './quest-003-dyers-crypt';

describe('applyHealthFromChoiceEffect', () => {
  it('removes a fraction of current health', () => {
    const state = { ...createInitialQuestState(), health: 80 };
    const next = applyHealthFromChoiceEffect(state, { healthLossFraction: 0.5 });
    expect(next.health).toBe(40);
  });

  it('sets health to an absolute value after fractional loss', () => {
    const state = { ...createInitialQuestState(), health: 100 };
    const next = applyHealthFromChoiceEffect(state, {
      healthLossFraction: 0.25,
      healthSet: 100,
    });
    expect(next.health).toBe(100);
  });

  it('sets health from partial HP', () => {
    const state = { ...createInitialQuestState(), health: 75 };
    const next = applyHealthFromChoiceEffect(state, { healthSet: 100 });
    expect(next.health).toBe(100);
  });
});

describe("Dyer's Crypt skeleton fight", () => {
  it('applies severe wounded shoulder and half health on Fight them', () => {
    let state = createInitialQuestState();
    state = {
      ...state,
      health: 100,
      activeQuestId: quest003DyersCrypt.id,
      progressByQuestId: {
        [quest003DyersCrypt.id]: {
          currentStepId: 'skeleton-inside-gate',
          isCompleted: false,
          choiceHistory: [],
        },
      },
    };
    const next = applyChoice(state, quest003DyersCrypt, 'skeleton-fight');
    expect(next.health).toBe(50);
    expect(next.modifiers[WOUNDED_SHOULDER_INJURY_KEY]).toBe(SEVERE_INJURY_MAGNITUDE);
    expect(formatInjurySheetLine(WOUNDED_SHOULDER_INJURY_KEY, SEVERE_INJURY_MAGNITUDE)).toBe(
      'Wounded Shoulder (severe)'
    );
  });
});
