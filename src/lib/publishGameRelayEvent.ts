import type { NostrEvent } from '@nostrify/nostrify';
import { GAME_RELAY_BACKUP_URL, GAME_RELAY_PRIMARY_URL } from '@/lib/gameRelays';
import { recordRelayInteraction } from '@/lib/relayInteractionLog';

const DEFAULT_PUBLISH_TIMEOUT_MS = 5_000;

export type GameRelayEventPool = {
  relay: (url: string) => {
    event: (event: NostrEvent, opts?: { signal?: AbortSignal }) => Promise<unknown>;
  };
};

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return error instanceof Error && /aborted|abort/i.test(error.message);
}

/** Map low-level relay abort/timeouts to player-facing copy. */
export function gameRelayPublishError(lastError: unknown): Error {
  if (isAbortError(lastError)) {
    return new Error('Timed out publishing to game relays. Try again.');
  }
  if (lastError instanceof Error) return lastError;
  return new Error('Failed to publish to game relays.');
}

/** Publish to game relays; succeeds when any relay accepts the event. */
export async function publishGameRelayEvent(
  pool: GameRelayEventPool,
  event: NostrEvent,
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<void> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_PUBLISH_TIMEOUT_MS;
  const relayUrls = [GAME_RELAY_PRIMARY_URL, GAME_RELAY_BACKUP_URL];

  const results = await Promise.allSettled(
    relayUrls.map(async (url) => {
      const started = performance.now();
      const perRelaySignal = opts?.signal
        ? AbortSignal.any([opts.signal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs);
      try {
        await pool.relay(url).event(event, { signal: perRelaySignal });
        recordRelayInteraction({
          operation: 'publish',
          relayUrl: url,
          ok: true,
          latencyMs: performance.now() - started,
          detail: `kind:${event.kind}`,
        });
      } catch (error) {
        recordRelayInteraction({
          operation: 'publish',
          relayUrl: url,
          ok: false,
          latencyMs: performance.now() - started,
          detail: `kind:${event.kind} · ${isAbortError(error) ? 'timeout' : error instanceof Error ? error.message : 'publish failed'}`,
        });
        throw error;
      }
    })
  );

  if (results.some((r) => r.status === 'fulfilled')) return;

  const rejected = results.find((r) => r.status === 'rejected');
  throw gameRelayPublishError(
    rejected?.status === 'rejected' ? rejected.reason : new Error('Failed to publish to game relays.')
  );
}
