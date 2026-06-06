import type { NostrFilter } from '@nostrify/nostrify';
import {
  GAME_RELAY_PRIMARY_URL,
  GAME_RELAY_QUERY_TIMEOUT_MS,
  GAME_RELAY_URLS,
} from '@/lib/gameRelays';
import { recordRelayInteraction } from '@/lib/relayInteractionLog';

const PROBE_FILTER: NostrFilter = { kinds: [1], limit: 1 };

export type GameRelayProbeStatus = 'up' | 'timeout' | 'down';

export type GameRelayProbeResult = {
  url: string;
  role: 'primary' | 'backup';
  status: GameRelayProbeStatus;
  latencyMs: number | null;
  detail: string | null;
};

export type GameRelayHealthSnapshot = {
  probedAtMs: number;
  queryTimeoutMs: number;
  relays: GameRelayProbeResult[];
};

export type GameRelayProbePool = {
  relay: (url: string) => {
    query: (filters: NostrFilter[], opts?: { signal?: AbortSignal }) => Promise<unknown[]>;
  };
};

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return error instanceof Error && /aborted|abort/i.test(error.message);
}

function relayRole(url: string): 'primary' | 'backup' {
  return url === GAME_RELAY_PRIMARY_URL ? 'primary' : 'backup';
}

export async function probeGameRelay(
  pool: GameRelayProbePool,
  url: string,
  timeoutMs = GAME_RELAY_QUERY_TIMEOUT_MS
): Promise<GameRelayProbeResult> {
  const started = performance.now();
  try {
    await pool.relay(url).query([PROBE_FILTER], { signal: AbortSignal.timeout(timeoutMs) });
    const latencyMs = Math.round(performance.now() - started);
    recordRelayInteraction({
      operation: 'probe',
      relayUrl: url,
      ok: true,
      latencyMs,
      detail: 'health probe',
    });
    return {
      url,
      role: relayRole(url),
      status: 'up',
      latencyMs,
      detail: null,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    if (isAbortError(error)) {
      recordRelayInteraction({
        operation: 'probe',
        relayUrl: url,
        ok: false,
        latencyMs,
        detail: `health probe · timeout ${timeoutMs}ms`,
      });
      return {
        url,
        role: relayRole(url),
        status: 'timeout',
        latencyMs,
        detail: `No response within ${timeoutMs}ms`,
      };
    }
    const detail = error instanceof Error ? error.message : 'Connection failed';
    recordRelayInteraction({
      operation: 'probe',
      relayUrl: url,
      ok: false,
      latencyMs,
      detail: `health probe · ${detail}`,
    });
    return {
      url,
      role: relayRole(url),
      status: 'down',
      latencyMs,
      detail,
    };
  }
}

export async function probeAllGameRelays(
  pool: GameRelayProbePool,
  timeoutMs = GAME_RELAY_QUERY_TIMEOUT_MS
): Promise<GameRelayHealthSnapshot> {
  const relays = await Promise.all(
    GAME_RELAY_URLS.map((url) => probeGameRelay(pool, url, timeoutMs))
  );
  return {
    probedAtMs: Date.now(),
    queryTimeoutMs: timeoutMs,
    relays,
  };
}
