import { describe, expect, it } from 'vitest';
import { formatQuestChoiceDevLines, formatQuestChoiceModifierDevLines } from './questChoiceEffectsDev';
import type { QuestChoice } from '../quests/types';

const boarChoice: QuestChoice = {
  id: 'q1-origin-boar-strike',
  label: 'Attack',
  nextStepId: 'boar-aftermath',
  effects: {
    modifiersDelta: { WarriorClass: 1, Strength: 1 },
    flagsSet: ['example-flag'],
  },
};

describe('formatQuestChoiceModifierDevLines', () => {
  it('lists modifiersDelta and quest items', () => {
    const text = formatQuestChoiceModifierDevLines({
      ...boarChoice,
      effects: {
        ...boarChoice.effects,
        questItemsAdd: ['a flask'],
      },
    }).join('\n');
    expect(text).toContain('modifiersDelta: Strength +1, WarriorClass +1');
    expect(text).toContain('questItemsAdd: a flask');
    expect(text).not.toContain('flagsSet');
  });

  it('returns empty when no modifiers or items', () => {
    expect(formatQuestChoiceModifierDevLines({ id: 'q-empty', label: 'Wait' })).toEqual([]);
  });
});

describe('formatQuestChoiceDevLines', () => {
  it('lists flags and routing without modifiers', () => {
    const text = formatQuestChoiceDevLines(boarChoice).join('\n');
    expect(text).not.toContain('modifiersDelta');
    expect(text).toContain('flagsSet: example-flag');
    expect(text).toContain('nextStepId: boar-aftermath');
  });

  it('reports empty choices', () => {
    const lines = formatQuestChoiceDevLines({ id: 'q-empty', label: 'Wait' });
    expect(lines).toEqual(['(no flags or routing)']);
  });
});
