import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

import { BLOBBI_STATE_KIND, BLOBBI_STATE_QUERY_LIMIT } from './constants';

export type BlobbiSnapshot = {
  id: string;
  stage: string;
  health: number;
  hunger: number;
  happiness: number;
  hygiene: number;
  energy: number;
  baseColor?: string;
  personality?: string;
  displayName: string;
  content: string;
  createdAt: number;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

const parseStat = (raw: string | undefined, fallback = 0): number => {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
};

export function parseBlobbiState(event: NostrEvent): BlobbiSnapshot | null {
  if (event.kind !== BLOBBI_STATE_KIND) return null;
  const d = tagValue(event, 'd')?.trim();
  if (!d) return null;

  const content = event.content.trim();
  const stage = tagValue(event, 'stage')?.trim() || 'unknown';
  const displayName =
    content.split(/\s+is\s+/i)[0]?.trim() ||
    d.replace(/^blobbi-?/i, '').replace(/-/g, ' ') ||
    d;

  return {
    id: d,
    stage,
    health: parseStat(tagValue(event, 'health'), 1),
    hunger: parseStat(tagValue(event, 'hunger')),
    happiness: parseStat(tagValue(event, 'happiness')),
    hygiene: parseStat(tagValue(event, 'hygiene')),
    energy: parseStat(tagValue(event, 'energy')),
    baseColor: tagValue(event, 'base_color'),
    personality: tagValue(event, 'personality'),
    displayName,
    content,
    createdAt: event.created_at,
  };
}

/** Latest state per `d` tag (newest created_at wins). */
export function listLatestBlobbiStates(events: readonly NostrEvent[]): BlobbiSnapshot[] {
  const byId = new Map<string, BlobbiSnapshot>();
  for (const event of events) {
    const row = parseBlobbiState(event);
    if (!row) continue;
    const prev = byId.get(row.id);
    if (!prev || row.createdAt >= prev.createdAt) byId.set(row.id, row);
  }
  return Array.from(byId.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export const blobbiStateFilter = (pubkey: string): NostrFilter => ({
  kinds: [BLOBBI_STATE_KIND],
  authors: [pubkey],
  limit: BLOBBI_STATE_QUERY_LIMIT,
});
