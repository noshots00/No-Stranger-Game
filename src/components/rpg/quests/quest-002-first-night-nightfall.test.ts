import { describe, expect, it } from 'vitest';
import { choiceIsVisible, resolveChoiceLockState } from '@/components/rpg/quest-scene/questSceneStepHelpers';
import {
  advanceQuestMessage,
  applyChoice,
  autoAdvanceContinueBridgeSteps,
  createInitialQuestState,
  getCurrentStep,
} from './engine';
import { buildFirstNightJournalSummary } from './quest-002-first-night-journal';
import {
  FIRST_NIGHT_FLAG_POCKET_FLASK,
  FIRST_NIGHT_FLAG_USED_FLASK,
  quest002FirstNight,
} from './quest-002-first-night';

function nightfallState(flags: string[] = []) {
  return {
    ...createInitialQuestState(),
    flags,
    progressByQuestId: {
      [quest002FirstNight.id]: {
        currentStepId: 'nightfall-wait',
        isCompleted: false,
        choiceHistory: [],
        devStepHistory: [],
      },
    },
  };
}

describe('Sunset nightfall closing beat', () => {
  it('routes boar aftermath Continue to nightfall-wait', () => {
    let state = createInitialQuestState();
    state = {
      ...state,
      progressByQuestId: {
        [quest002FirstNight.id]: {
          currentStepId: 'boar-aftermath-strike',
          isCompleted: false,
          choiceHistory: ['q1-origin-boar-strike'],
          devStepHistory: [],
        },
      },
    };
    state = advanceQuestMessage(state, quest002FirstNight)!;
    expect(getCurrentStep(state, quest002FirstNight).id).toBe('nightfall-wait');
  });

  it('shows flask use only when the player found a flask', () => {
    const step = getCurrentStep(nightfallState([FIRST_NIGHT_FLAG_POCKET_FLASK]), quest002FirstNight);
    expect(step.type).toBe('choice');
    if (step.type !== 'choice') return;
    const flask = step.choices.find((c) => c.id === 'q2-night-use-flask');
    expect(flask).toBeDefined();
    expect(choiceIsVisible(flask!, new Set([FIRST_NIGHT_FLAG_POCKET_FLASK]))).toBe(true);
    expect(choiceIsVisible(flask!, new Set())).toBe(false);
  });

  it('disables flask use after one shot and returns to the hub', () => {
    let state = nightfallState([FIRST_NIGHT_FLAG_POCKET_FLASK]);
    state = applyChoice(state, quest002FirstNight, 'q2-night-use-flask');
    state = autoAdvanceContinueBridgeSteps(state, quest002FirstNight);
    expect(getCurrentStep(state, quest002FirstNight).id).toBe('nightfall-wait');
    const step = getCurrentStep(state, quest002FirstNight);
    if (step.type !== 'choice') return;
    const flask = step.choices.find((c) => c.id === 'q2-night-use-flask')!;
    const lock = resolveChoiceLockState(flask, new Set(state.flags), {}, []);
    expect(lock.isLocked).toBe(true);
    expect(state.flags).toContain(FIRST_NIGHT_FLAG_USED_FLASK);
  });

  it('completes Sunset when the player waits until morning', () => {
    const state = applyChoice(nightfallState(), quest002FirstNight, 'q2-night-wait-morning');
    expect(state.progressByQuestId[quest002FirstNight.id]?.isCompleted).toBe(true);
  });

  it('journal ends with made it through the night', () => {
    expect(buildFirstNightJournalSummary([])).toContain('You made it through the night.');
    expect(buildFirstNightJournalSummary([])).not.toContain('primitive shelter');
  });
});
