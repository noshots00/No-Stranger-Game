import type { NostrFilter } from '@nostrify/nostrify';
import { useSyncExternalStore } from 'react';

import { GAME_RELAY_URLS } from '@/lib/gameRelays';

export type RelayInteractionOperation = 'query' | 'publish' | 'probe';

export type RelayInteractionEntry = {
  id: string;
  atMs: number;
  operation: RelayInteractionOperation;
  relayUrl: string;
  ok: boolean;
  latencyMs: number;
  detail: string;
  eventCount?: number;
};

export type RelayInteractionTotals = {
  total: number;
  queries: number;
  publishes: number;
  probes: number;
  ok: number;
  failed: number;
  byRelay: Record<string, { total: number; ok: number; failed: number }>;
};

export type GameRelayBatchOperation = 'query' | 'publish';
export type RelayLegStatus = 'ok' | 'failed';

export type GameRelayBatch = {
  operation: GameRelayBatchOperation;
  atMs: number;
  byRelay: Record<string, RelayLegStatus>;
};

export type RelayLegIndicatorStatus = 'unknown' | 'ok' | 'failed';

export type RelayHealthIndicatorState = {
  inFlight: boolean;
  primaryStatus: RelayLegIndicatorStatus;
  backupStatus: RelayLegIndicatorStatus;
  latestOperation: GameRelayBatchOperation | null;
};

export type GameRelayBatchHandle = {
  completeLeg: (relayUrl: string, ok: boolean) => void;
  finalize: () => void;
};

const MAX_ENTRIES = 120;

let nextId = 1;
let entries: RelayInteractionEntry[] = [];
let inFlightGameRequests = 0;
let latestGameBatch: GameRelayBatch | null = null;
const listeners = new Set<() => void>();

function emptyRelayTotals(): Record<string, { total: number; ok: number; failed: number }> {
  return Object.fromEntries(
    GAME_RELAY_URLS.map((url) => [url, { total: 0, ok: 0, failed: 0 }])
  ) as Record<string, { total: number; ok: number; failed: number }>;
}

function computeTotals(rows: readonly RelayInteractionEntry[]): RelayInteractionTotals {
  const byRelay = emptyRelayTotals();
  let queries = 0;
  let publishes = 0;
  let probes = 0;
  let ok = 0;
  let failed = 0;

  for (const row of rows) {
    if (row.operation === 'query') queries += 1;
    else if (row.operation === 'publish') publishes += 1;
    else probes += 1;
    if (row.ok) ok += 1;
    else failed += 1;
    const bucket = byRelay[row.relayUrl];
    if (bucket) {
      bucket.total += 1;
      if (row.ok) bucket.ok += 1;
      else bucket.failed += 1;
    }
  }

  return {
    total: rows.length,
    queries,
    publishes,
    probes,
    ok,
    failed,
    byRelay,
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

function finalizeBatchByRelay(
  legs: Partial<Record<string, RelayLegStatus>>
): Record<string, RelayLegStatus> {
  return Object.fromEntries(
    GAME_RELAY_URLS.map((url) => [url, legs[url] ?? 'failed'])
  ) as Record<string, RelayLegStatus>;
}

/** Derive header indicator halves from in-flight count and latest query/publish batch. */
export function deriveRelayHealthIndicatorState(
  inFlight: number,
  batch: GameRelayBatch | null
): RelayHealthIndicatorState {
  const [primaryUrl, backupUrl] = GAME_RELAY_URLS;

  if (inFlight > 0) {
    return {
      inFlight: true,
      primaryStatus: 'unknown',
      backupStatus: 'unknown',
      latestOperation: null,
    };
  }

  if (!batch) {
    return {
      inFlight: false,
      primaryStatus: 'unknown',
      backupStatus: 'unknown',
      latestOperation: null,
    };
  }

  const legToIndicator = (status: RelayLegStatus | undefined): RelayLegIndicatorStatus =>
    status === 'ok' ? 'ok' : 'failed';

  return {
    inFlight: false,
    primaryStatus: legToIndicator(batch.byRelay[primaryUrl]),
    backupStatus: legToIndicator(batch.byRelay[backupUrl]),
    latestOperation: batch.operation,
  };
}

export function beginGameRelayBatch(operation: GameRelayBatchOperation): GameRelayBatchHandle {
  inFlightGameRequests += 1;
  const legs: Partial<Record<string, RelayLegStatus>> = {};
  emit();

  return {
    completeLeg(relayUrl: string, ok: boolean) {
      legs[relayUrl] = ok ? 'ok' : 'failed';
      emit();
    },
    finalize() {
      latestGameBatch = {
        operation,
        atMs: Date.now(),
        byRelay: finalizeBatchByRelay(legs),
      };
      inFlightGameRequests = Math.max(0, inFlightGameRequests - 1);
      emit();
    },
  };
}

export function getInFlightGameRequests(): number {
  return inFlightGameRequests;
}

export function getLatestGameRelayBatch(): GameRelayBatch | null {
  return latestGameBatch;
}

export function summarizeNostrFilters(filters: readonly NostrFilter[]): string {
  const parts: string[] = [];
  for (const filter of filters) {
    const bits: string[] = [];
    if (filter.kinds?.length) bits.push(`k:${filter.kinds.join(',')}`);
    if (filter.authors?.length) bits.push(`authors:${filter.authors.length}`);
    if (filter.ids?.length) bits.push(`ids:${filter.ids.length}`);
    if (filter['#d']?.length) bits.push(`#d:${filter['#d'].join(',')}`);
    if (filter['#t']?.length) bits.push(`#t:${filter['#t'].join(',')}`);
    if (filter['#e']?.length) bits.push(`#e:${filter['#e'].length}`);
    if (filter.limit) bits.push(`limit:${filter.limit}`);
    parts.push(bits.length > 0 ? bits.join(' ') : 'filter');
  }
  return parts.join(' | ');
}

export function recordRelayInteraction(input: {
  operation: RelayInteractionOperation;
  relayUrl: string;
  ok: boolean;
  latencyMs: number;
  detail: string;
  eventCount?: number;
}): void {
  const row: RelayInteractionEntry = {
    id: String(nextId++),
    atMs: Date.now(),
    operation: input.operation,
    relayUrl: input.relayUrl,
    ok: input.ok,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    detail: input.detail,
    eventCount: input.eventCount,
  };
  entries = [row, ...entries].slice(0, MAX_ENTRIES);
  emit();
}

export function clearRelayInteractionLog(): void {
  entries = [];
  emit();
}

export function getRelayInteractionEntries(): readonly RelayInteractionEntry[] {
  return entries;
}

export function getRelayInteractionTotals(): RelayInteractionTotals {
  return computeTotals(entries);
}

let relayHealthIndicatorSnapshot: RelayHealthIndicatorState = deriveRelayHealthIndicatorState(0, null);

function getRelayHealthIndicatorSnapshot(): RelayHealthIndicatorState {
  const next = deriveRelayHealthIndicatorState(inFlightGameRequests, latestGameBatch);
  if (
    relayHealthIndicatorSnapshot.inFlight === next.inFlight &&
    relayHealthIndicatorSnapshot.primaryStatus === next.primaryStatus &&
    relayHealthIndicatorSnapshot.backupStatus === next.backupStatus &&
    relayHealthIndicatorSnapshot.latestOperation === next.latestOperation
  ) {
    return relayHealthIndicatorSnapshot;
  }
  relayHealthIndicatorSnapshot = next;
  return relayHealthIndicatorSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRelayInteractionLog(): {
  entries: readonly RelayInteractionEntry[];
  totals: RelayInteractionTotals;
  clearLog: () => void;
} {
  const snapshot = useSyncExternalStore(subscribe, () => entries, () => entries);
  return {
    entries: snapshot,
    totals: computeTotals(snapshot),
    clearLog: clearRelayInteractionLog,
  };
}

export function useRelayHealthIndicator(): RelayHealthIndicatorState {
  return useSyncExternalStore(
    subscribe,
    getRelayHealthIndicatorSnapshot,
    getRelayHealthIndicatorSnapshot
  );
}
