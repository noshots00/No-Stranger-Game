import { describe, expect, it } from 'vitest';

import { GAME_RELAY_URLS } from '@/lib/gameRelays';
import { deriveRelayHealthIndicatorState, type GameRelayBatch } from '@/lib/relayInteractionLog';

const [primaryUrl, backupUrl] = GAME_RELAY_URLS;

function batch(
  operation: GameRelayBatch['operation'],
  primary: 'ok' | 'failed',
  backup: 'ok' | 'failed'
): GameRelayBatch {
  return {
    operation,
    atMs: Date.now(),
    byRelay: {
      [primaryUrl]: primary,
      [backupUrl]: backup,
    },
  };
}

describe('deriveRelayHealthIndicatorState', () => {
  it('returns in-flight with unknown legs while requests are pending', () => {
    expect(deriveRelayHealthIndicatorState(1, null)).toEqual({
      inFlight: true,
      primaryStatus: 'unknown',
      backupStatus: 'unknown',
      latestOperation: null,
    });
  });

  it('returns unknown legs when no batch has completed yet', () => {
    expect(deriveRelayHealthIndicatorState(0, null)).toEqual({
      inFlight: false,
      primaryStatus: 'unknown',
      backupStatus: 'unknown',
      latestOperation: null,
    });
  });

  it('maps both relays ok', () => {
    expect(deriveRelayHealthIndicatorState(0, batch('query', 'ok', 'ok'))).toEqual({
      inFlight: false,
      primaryStatus: 'ok',
      backupStatus: 'ok',
      latestOperation: 'query',
    });
  });

  it('maps primary ok and backup failed', () => {
    expect(deriveRelayHealthIndicatorState(0, batch('publish', 'ok', 'failed'))).toEqual({
      inFlight: false,
      primaryStatus: 'ok',
      backupStatus: 'failed',
      latestOperation: 'publish',
    });
  });

  it('maps both relays failed', () => {
    expect(deriveRelayHealthIndicatorState(0, batch('query', 'failed', 'failed'))).toEqual({
      inFlight: false,
      primaryStatus: 'failed',
      backupStatus: 'failed',
      latestOperation: 'query',
    });
  });
});
