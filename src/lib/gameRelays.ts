import type { RelayMetadata } from '@/contexts/AppContext';

/** Primary game relay — preferred for reads when merging with backup. */
export const GAME_RELAY_PRIMARY_URL = 'wss://relay.ditto.pub' as const;

/** Backup game relay — fills gaps; replaceable rows on primary win over backup. */
export const GAME_RELAY_BACKUP_URL = 'wss://relay.dreamith.to' as const;

/** Canonical game relays — order: primary, then backup. */
export const GAME_RELAY_URLS = [GAME_RELAY_PRIMARY_URL, GAME_RELAY_BACKUP_URL] as const;

/** Per-relay query timeout when merging primary + backup reads. */
export const GAME_RELAY_QUERY_TIMEOUT_MS = 6_000;

export const DEFAULT_GAME_RELAY_METADATA: RelayMetadata = {
  relays: GAME_RELAY_URLS.map((url) => ({ url, read: true, write: true })),
  updatedAt: 0,
};
