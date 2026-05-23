import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import {
  GAME_RELAY_BACKUP_URL,
  GAME_RELAY_PRIMARY_URL,
  GAME_RELAY_QUERY_TIMEOUT_MS,
} from '@/lib/gameRelays';
import { mergeRelayQueryResults } from '@/lib/mergeRelayQueryResults';

export type GameRelayQueryPool = {
  relay: (url: string) => {
    query: (filters: NostrFilter[], opts?: { signal?: AbortSignal }) => Promise<NostrEvent[]>;
  };
};

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
  opts?: { signal?: AbortSignal }
): Promise<NostrEvent[]> {
  const signal = opts?.signal ?? AbortSignal.timeout(GAME_RELAY_QUERY_TIMEOUT_MS);
  const [primary, backup] = await Promise.all([
    queryOneRelay(pool, GAME_RELAY_PRIMARY_URL, filters, signal),
    queryOneRelay(pool, GAME_RELAY_BACKUP_URL, filters, signal),
  ]);
  return mergeRelayQueryResults(primary, backup);
}
