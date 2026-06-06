import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import {
  GAME_RELAY_BACKUP_URL,
  GAME_RELAY_PRIMARY_URL,
  GAME_RELAY_QUERY_TIMEOUT_MS,
} from '@/lib/gameRelays';
import { mergeRelayQueryResults } from '@/lib/mergeRelayQueryResults';
import { filterValidCommunityEvents } from '@/lib/communityEventEpoch';

export type GameRelayQueryPool = {
  relay: (url: string) => {
    query: (filters: NostrFilter[], opts?: { signal?: AbortSignal }) => Promise<NostrEvent[]>;
  };
};

function relayQuerySignal(parent: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return parent ? AbortSignal.any([parent, timeout]) : timeout;
}

async function queryOneRelay(
  pool: GameRelayQueryPool,
  url: string,
  filters: NostrFilter[],
  signal: AbortSignal
): Promise<NostrEvent[]> {
  try {
    return await pool.relay(url).query(filters, { signal });
  } catch {
    return [];
  }
}

/** Query primary and backup in parallel; merge with primary preference for replaceable rows. */
export async function queryGameRelays(
  pool: GameRelayQueryPool,
  filters: NostrFilter[],
  opts?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<NostrEvent[]> {
  const timeoutMs = opts?.timeoutMs ?? GAME_RELAY_QUERY_TIMEOUT_MS;
  const [primary, backup] = await Promise.all([
    queryOneRelay(
      pool,
      GAME_RELAY_PRIMARY_URL,
      filters,
      relayQuerySignal(opts?.signal, timeoutMs)
    ),
    queryOneRelay(
      pool,
      GAME_RELAY_BACKUP_URL,
      filters,
      relayQuerySignal(opts?.signal, timeoutMs)
    ),
  ]);
  return filterValidCommunityEvents(mergeRelayQueryResults(primary, backup));
}
