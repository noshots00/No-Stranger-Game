import { describe, expect, it } from 'vitest';
import { formatQuestChoiceDevLines } from './questChoiceEffectsDev';
import type { QuestChoice } from '../quests/types';

describe('formatQuestChoiceDevLines', () => {
  it('lists modifiers and flags on a boar-style choice', () => {
    const choice: QuestChoice = {
      id: 'q1-origin-boar-strike',
      label: 'Attack',
      nextStepId: 'boar-aftermath',
      effects: {
        modifiersDelta: { WarriorClass: 1, Strength: 1 },
        flagsSet: ['example-flag'],
      },
    };
    const text = formatQuestChoiceDevLines(choice).join('\n');
    expect(text).toContain('modifiersDelta: WarriorClass +1, Strength +1');
    expect(text).toContain('flagsSet: example-flag');
    expect(text).toContain('nextStepId: boar-aftermath');
  });

  it('reports empty choices', () => {
    const lines = formatQuestChoiceDevLines({ id: 'q-empty', label: 'Wait' });
    expect(lines).toEqual(['(no modifiers, flags, or routing)']);
  });
});
