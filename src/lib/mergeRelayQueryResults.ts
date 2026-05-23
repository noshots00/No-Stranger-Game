import type { NostrEvent } from '@nostrify/nostrify';

/** Replaceable / addressable rows keyed by kind + author + `d` tag. */
function replaceableRowKey(event: NostrEvent): string | null {
  const d = event.tags.find(([name]) => name === 'd')?.[1];
  if (!d) return null;
  return `${event.kind}:${event.pubkey}:${d}`;
}

/**
 * Merge primary and backup relay query results.
 * - Dedupe by event id.
 * - When both relays have a replaceable row for the same key, keep the primary copy.
 * - Events only on backup are included when primary has no row for that key.
 */
export function mergeRelayQueryResults(
  primary: readonly NostrEvent[],
  backup: readonly NostrEvent[]
): NostrEvent[] {
  const byId = new Map<string, NostrEvent>();
  const primaryReplaceableKeys = new Set<string>();

  for (const event of primary) {
    byId.set(event.id, event);
    const key = replaceableRowKey(event);
    if (key) primaryReplaceableKeys.add(key);
  }

  for (const event of backup) {
    if (byId.has(event.id)) continue;
    const key = replaceableRowKey(event);
    if (key && primaryReplaceableKeys.has(key)) continue;
    byId.set(event.id, event);
  }

  return [...byId.values()];
}
