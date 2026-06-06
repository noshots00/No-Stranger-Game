import { describe, expect, it, vi } from 'vitest';

import { recycleGameRelay } from './recycleGameRelay';

describe('recycleGameRelay', () => {
  it('evicts a cached relay so the pool can open a fresh connection', async () => {
    const close = vi.fn(async () => {});
    const relay = { close };
    const relays = new Map([['wss://relay.ditto.pub', relay]]);

    recycleGameRelay({ _relays: relays }, 'wss://relay.ditto.pub');

    expect(relays.has('wss://relay.ditto.pub')).toBe(false);
    expect(close).toHaveBeenCalledOnce();
  });
});
