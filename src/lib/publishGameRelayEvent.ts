import type { NostrEvent } from '@nostrify/nostrify';
import { GAME_RELAY_BACKUP_URL, GAME_RELAY_PRIMARY_URL } from '@/lib/gameRelays';

const DEFAULT_PUBLISH_TIMEOUT_MS = 5_000;

export type GameRelayEventPool = {
  relay: (url: string) => {
    event: (event: NostrEvent, opts?: { signal?: AbortSignal }) => Promise<unknown>;
  };
};

/** Publish to both game relays (independent of per-user NIP-65 relay list). */
export async function publishGameRelayEvent(
  pool: GameRelayEventPool,
  event: NostrEvent,
  opts?: { signal?: AbortSignal }
): Promise<void> {
  const signal = opts?.signal ?? AbortSignal.timeout(DEFAULT_PUBLISH_TIMEOUT_MS);
  const results = await Promise.allSettled([
    pool.relay(GAME_RELAY_PRIMARY_URL).event(event, { signal }),
    pool.relay(GAME_RELAY_BACKUP_URL).event(event, { signal }),
  ]);
  if (results.some((r) => r.status === 'fulfilled')) return;
  const rejected = results.find((r) => r.status === 'rejected');
  throw rejected?.status === 'rejected'
    ? rejected.reason
    : new Error('Failed to publish to game relays.');
}
