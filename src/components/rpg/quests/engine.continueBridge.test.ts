import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  autoAdvanceContinueBridgeSteps,
  collectContinueBridgeChainTexts,
  createInitialQuestState,
  getCurrentStep,
  resolveQuestSceneTextBands,
  startQuest,
} from './engine';
import type { QuestProgress } from './types';
import { quest002FirstNight } from './quest-002-first-night';

function firstNightAtHub() {
  let state = createInitialQuestState();
  state = startQuest(state, quest002FirstNight);
  return {
    ...state,
    progressByQuestId: {
      ...state.progressByQuestId,
      [quest002FirstNight.id]: {
        currentStepId: 'flavor-five-hub',
        isCompleted: false,
        choiceHistory: [],
        devStepHistory: [],
      },
    },
  };
}

describe('continue bridge message steps', () => {
  it('skips flavor-pockets and lands on pocket pick with narrative text', () => {
    let state = firstNightAtHub();
    state = {
      ...state,
      progressByQuestId: {
        ...state.progressByQuestId,
        [quest002FirstNight.id]: {
          ...state.progressByQuestId[quest002FirstNight.id]!,
          currentStepId: 'flavor-five',
        },
      },
    };

    state = applyChoice(state, quest002FirstNight, 'q2-check-pockets');
    const step = getCurrentStep(state, quest002FirstNight);
    const progress = state.progressByQuestId[quest002FirstNight.id] as QuestProgress;

    expect(step.id).toBe('flavor-pockets-pick');
    expect(step.type).toBe('choice');
    expect(progress?.lastBeatResponse).toContain('Your hand finds');
    expect(resolveQuestSceneTextBands(quest002FirstNight, step, progress, 'Ada').response).toContain(
      'Your hand finds'
    );
  });

  it('stores climb-tree bridge chain and shows it on the tree fork', () => {
    let state = firstNightAtHub();
    state = applyChoice(state, quest002FirstNight, 'q2-climb-tree');
    const step = getCurrentStep(state, quest002FirstNight);
    const progress = state.progressByQuestId[quest002FirstNight.id] as QuestProgress;
    const bands = resolveQuestSceneTextBands(quest002FirstNight, step, progress, 'Ada');

    expect(step.id).toBe('flavor-tree-fork');
    expect(progress?.lastBeatResponse).toContain('harder than it looks');
    expect(progress?.lastBeatResponse).toContain('too thick to see');
    expect(bands.response).toContain('harder than it looks');
  });

  it('stores fall outcome when going back down and shows it on the hub prompt', () => {
    let state = firstNightAtHub();
    state = applyChoice(state, quest002FirstNight, 'q2-climb-tree');
    state = applyChoice(state, quest002FirstNight, 'q2-tree-go-down');
    const step = getCurrentStep(state, quest002FirstNight);
    const progress = state.progressByQuestId[quest002FirstNight.id] as QuestProgress;
    const bands = resolveQuestSceneTextBands(quest002FirstNight, step, progress, 'Ada');

    expect(step.id).toBe('flavor-five-hub');
    expect(progress?.lastBeatResponse).toContain('fall from the tree');
    expect(bands.response).toContain('fall from the tree');
    expect(bands.prompt).toContain('What do you do now');
  });

  it('allows climbing higher three times before only going back down', () => {
    let state = firstNightAtHub();
    state = applyChoice(state, quest002FirstNight, 'q2-climb-tree');
    state = applyChoice(state, quest002FirstNight, 'q2-tree-climb-higher');
    expect(getCurrentStep(state, quest002FirstNight).id).toBe('flavor-tree-fork-2');
    state = applyChoice(state, quest002FirstNight, 'q2-tree-climb-higher');
    expect(getCurrentStep(state, quest002FirstNight).id).toBe('flavor-tree-fork-3');
    state = applyChoice(state, quest002FirstNight, 'q2-tree-climb-higher');
    const step = getCurrentStep(state, quest002FirstNight);
    expect(step.id).toBe('flavor-tree-fork-4');
    expect(step.type).toBe('choice');
    if (step.type === 'choice') {
      expect(step.choices.map((c) => c.label)).toEqual(['Go back down']);
    }
  });

  it('stores high-ground narration before the boar prompt', () => {
    let state = firstNightAtHub();
    state = applyChoice(state, quest002FirstNight, 'q2-high-ground');
    const step = getCurrentStep(state, quest002FirstNight);
    const progress = state.progressByQuestId[quest002FirstNight.id] as QuestProgress;
    const bands = resolveQuestSceneTextBands(quest002FirstNight, step, progress, 'Ada');

    expect(step.id).toBe('boar-encounter');
    expect(progress?.lastBeatResponse).toContain('steepen');
    expect(bands.response).toContain('steepen');
    expect(bands.prompt).toContain('boar charges');
  });

  it('pauses on boar aftermath until Continue after casting a spell', () => {
    let state = firstNightAtHub();
    state = applyChoice(state, quest002FirstNight, 'q2-high-ground');
    state = applyChoice(state, quest002FirstNight, 'q1-origin-boar-spark');
    const step = getCurrentStep(state, quest002FirstNight);
    const progress = state.progressByQuestId[quest002FirstNight.id] as QuestProgress;

    expect(step.id).toBe('boar-aftermath-spark');
    expect(step.type).toBe('message');
    if (step.type === 'message') {
      expect(step.requireContinueTap).toBe(true);
      expect(step.text).toContain('using magic');
    }
    expect(progress?.isCompleted).toBe(false);
  });

  it('collects bridge texts along the chain', () => {
    const texts = collectContinueBridgeChainTexts(
      quest002FirstNight,
      'flavor-pockets',
      'flavor-pockets-pick'
    );
    expect(texts).toEqual(['Your hand finds the familiar shape of...']);
  });

  it('autoAdvanceContinueBridgeSteps is idempotent on choice steps', () => {
    let state = firstNightAtHub();
    state = applyChoice(state, quest002FirstNight, 'q2-check-pockets');
    const once = autoAdvanceContinueBridgeSteps(state, quest002FirstNight);
    const twice = autoAdvanceContinueBridgeSteps(once, quest002FirstNight);
    expect(getCurrentStep(twice, quest002FirstNight).id).toBe('flavor-pockets-pick');
  });
});
