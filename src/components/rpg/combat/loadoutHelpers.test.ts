import { describe, expect, it } from 'vitest';
import { isEquipLoadoutQuestComplete } from '../combat/loadoutHelpers';
import { createInitialQuestState } from '../quests/engine';

describe('isEquipLoadoutQuestComplete', () => {
  it('requires gear and a skill slot', () => {
    const base = createInitialQuestState();
    expect(
      isEquipLoadoutQuestComplete({
        ...base,
        modifiers: { 'item:hatchet': 1, SparkSpell: 1 },
        loadout: { weapon: 'item:hatchet', skillA: 'spell:spark' },
      })
    ).toBe(true);
    expect(
      isEquipLoadoutQuestComplete({
        ...base,
        modifiers: { 'item:stone-mason-chisel': 1, Heavy_AttackSkill: 1 },
        loadout: { other: 'item:stone-mason-chisel', skillB: 'Heavy_AttackSkill' },
      })
    ).toBe(true);
    expect(
      isEquipLoadoutQuestComplete({
        ...base,
        modifiers: { 'item:hatchet': 1, SparkSpell: 1 },
        loadout: { weapon: 'item:hatchet' },
      })
    ).toBe(false);
    expect(
      isEquipLoadoutQuestComplete({
        ...base,
        modifiers: { SparkSpell: 1 },
        loadout: { skillA: 'spell:spark' },
      })
    ).toBe(false);
  });
});
