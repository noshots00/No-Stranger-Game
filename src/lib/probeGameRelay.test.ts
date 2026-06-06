import { describe, expect, it, vi } from 'vitest';

import { probeGameRelay } from './probeGameRelay';

describe('probeGameRelay', () => {
  it('reports up when query succeeds', async () => {
    const pool = {
      relay: () => ({
        query: vi.fn(async () => [{ id: '1' }]),
      }),
    };
    const result = await probeGameRelay(pool, 'wss://relay.ditto.pub', 1000);
    expect(result.status).toBe('up');
    expect(result.latencyMs).not.toBeNull();
  });

  it('reports timeout on abort', async () => {
    const pool = {
      relay: () => ({
        query: vi.fn(async () => {
          throw new DOMException('The signal has been aborted', 'AbortError');
        }),
      }),
    };
    const result = await probeGameRelay(pool, 'wss://relay.dreamith.to', 1000);
    expect(result.status).toBe('timeout');
    expect(result.detail).toContain('1000ms');
  });
});
