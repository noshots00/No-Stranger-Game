import { describe, expect, it } from 'vitest';
import { CLASS_UNLOCK_POINTS } from './constants';
import {
  buildDayReportDialogueLines,
  getModifierLevelUpLines,
  formatQuestItemGainReportLine,
  getQuestItemGainLines,
  shouldReportModifierGainInDayReport,
} from './helpers';
import { createInitialQuestState } from './quests/engine';

describe('day report modifier visibility', () => {
  it('reports primary stat gains immediately', () => {
    expect(shouldReportModifierGainInDayReport('stat:strength', 0, 1)).toBe(true);
    expect(shouldReportModifierGainInDayReport('Strength', 0, 1)).toBe(true);
  });

  it('suppresses sub-threshold trait gains', () => {
    expect(shouldReportModifierGainInDayReport('trait:courage', 0, 1)).toBe(false);
    expect(shouldReportModifierGainInDayReport('trait:courage', CLASS_UNLOCK_POINTS - 1, CLASS_UNLOCK_POINTS)).toBe(
      true
    );
  });

  it('reports injury at magnitude 1', () => {
    expect(shouldReportModifierGainInDayReport('injury:ankle', 0, 1)).toBe(true);
    expect(shouldReportModifierGainInDayReport('AnkleInjury', 0, 1)).toBe(true);
  });

  it('suppresses hidden class and race tallies', () => {
    expect(shouldReportModifierGainInDayReport('class:warrior', 0, 1)).toBe(false);
    expect(shouldReportModifierGainInDayReport('race:woodelf', 0, 1)).toBe(false);
  });

  it('reports organic skills at magnitude 1', () => {
    expect(shouldReportModifierGainInDayReport('skill:stealth', 0, 1)).toBe(true);
    expect(shouldReportModifierGainInDayReport('StealthSkill', 0, 1)).toBe(true);
  });

  it('getModifierLevelUpLines omits sub-threshold trait deltas', () => {
    const prev = createInitialQuestState();
    const next = {
      ...prev,
      modifiers: { ...prev.modifiers, 'trait:cautious': 2 },
    };
    const lines = getModifierLevelUpLines(prev, next);
    expect(lines.some((l) => /cautious/i.test(l))).toBe(false);
  });

  it('phrases spell gains as learned', () => {
    const prev = createInitialQuestState();
    const next = {
      ...prev,
      modifiers: { ...prev.modifiers, SparkSpell: 1 },
    };
    const lines = getModifierLevelUpLines(prev, next);
    expect(lines).toContain('You learned Spark!');
  });

  it('getModifierLevelUpLines includes unlocked trait and stat', () => {
    const prev = createInitialQuestState();
    const next = {
      ...prev,
      modifiers: {
        ...prev.modifiers,
        'trait:courage': CLASS_UNLOCK_POINTS,
        'stat:charisma': 1,
      },
    };
    const lines = getModifierLevelUpLines(prev, next);
    expect(lines.some((l) => /courage/i.test(l) && /trait/i.test(l))).toBe(true);
    expect(lines.some((l) => /charisma/i.test(l))).toBe(true);
  });

  it('formatQuestItemGainReportLine joins labels on one line', () => {
    expect(formatQuestItemGainReportLine(["It's a tiny buckler."])).toBe(
      "Gained items: It's a tiny buckler."
    );
    expect(formatQuestItemGainReportLine(['a flask', 'Fruit'])).toBe('Gained items: a flask, Fruit');
    expect(formatQuestItemGainReportLine([])).toBeNull();
  });

  it('getQuestItemGainLines lists new labels only', () => {
    const lines = getQuestItemGainLines([], ["It's a tiny buckler."]);
    expect(lines).toEqual(["It's a tiny buckler."]);
    expect(getQuestItemGainLines(["It's a tiny buckler."], ["It's a tiny buckler."])).toEqual([]);
  });

  it('buildDayReportDialogueLines includes quest items gained since baseline', () => {
    const prev = {
      ...createInitialQuestState(),
      questItems: [],
      dayReportQuestItemsBaseline: [],
    };
    const next = {
      ...prev,
      questItems: ["It's a tiny buckler."],
    };
    const text = buildDayReportDialogueLines(2, prev, next)
      .map((line) => line.text)
      .join('\n');
    expect(text).toContain("Gained items: It's a tiny buckler.");
  });

  it('buildDayReportDialogueLines still includes exploration/foraging XP', () => {
    const prev = createInitialQuestState();
    const next = {
      ...prev,
      skills: {
        ...prev.skills,
        explorationXp: 100,
        foragingXp: 100,
      },
    };
    const text = buildDayReportDialogueLines(1, prev, next)
      .map((line) => line.text)
      .join(' ');
    expect(text).toMatch(/exploration reached level/i);
    expect(text).toMatch(/foraging reached level/i);
  });
});
