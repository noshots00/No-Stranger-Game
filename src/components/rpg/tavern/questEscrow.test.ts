import { describe, expect, it } from 'vitest';

import { CURRENCY_COPPER_KEY, COPPER_PER_GOLD } from '../constants';
import { createInitialQuestState } from '../quests/engine';
import { getCopperFromModifiers } from '../helpers';
import { applyPostEscrow, refundEscrow } from './questEscrow';

describe('questEscrow refundEscrow', () => {
  it('restores gold after post escrow', () => {
    const base = createInitialQuestState();
    const walletCopper = 5 * COPPER_PER_GOLD;
    const withGold = {
      ...base,
      modifiers: { ...base.modifiers, [CURRENCY_COPPER_KEY]: walletCopper },
    };
    const escrowed = applyPostEscrow(withGold, 'quest-abc', { goldAmount: 2 });
    expect('error' in escrowed).toBe(false);
    if ('error' in escrowed) return;

    expect(getCopperFromModifiers(escrowed.state.modifiers)).toBe(3 * COPPER_PER_GOLD);
    const refunded = refundEscrow(escrowed.state, 'quest-abc');
    expect(getCopperFromModifiers(refunded.modifiers)).toBe(walletCopper);
    expect(refunded.tavernEscrowByQuestId?.['quest-abc']).toBeUndefined();
  });

  it('restores quest items after post escrow', () => {
    const base = createInitialQuestState();
    const withItem = {
      ...base,
      questItems: ['cigarettes and a lighter'],
    };
    const escrowed = applyPostEscrow(withItem, 'quest-cigarettes', {
      questItemLabel: 'cigarettes and a lighter',
    });
    expect('error' in escrowed).toBe(false);
    if ('error' in escrowed) return;

    expect(escrowed.state.questItems).not.toContain('cigarettes and a lighter');
    const refunded = refundEscrow(escrowed.state, 'quest-cigarettes');
    expect(refunded.questItems).toContain('cigarettes and a lighter');
  });
});
