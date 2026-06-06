import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

import { dittoNaddrUrl } from '@/lib/dittoExplorerUrl';
import { BLOBBI_STATE_KIND, BLOBBI_STATE_QUERY_LIMIT } from './constants';

export type BlobbiPattern = 'solid' | 'spotted' | 'striped' | 'gradient';
export type BlobbiSpecialMark = 'none' | 'star' | 'heart' | 'sparkle' | 'blush';
export type BlobbiSize = 'small' | 'medium' | 'large';

export type BlobbiSnapshot = {
  id: string;
  ownerPubkey: string;
  stage: string;
  health: number;
  hunger: number;
  happiness: number;
  hygiene: number;
  energy: number;
  seed?: string;
  baseColor?: string;
  secondaryColor?: string;
  eyeColor?: string;
  pattern?: BlobbiPattern;
  specialMark?: BlobbiSpecialMark;
  size?: BlobbiSize;
  imageUrl?: string;
  personality?: string;
  displayName: string;
  content: string;
  dittoPageUrl: string;
  createdAt: number;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

const parseStat = (raw: string | undefined, fallback = 0): number => {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
};

function parseImetaImageUrl(event: NostrEvent): string | undefined {
  for (const tag of event.tags) {
    if (tag[0] !== 'imeta') continue;
    const urlPart = tag.find((part) => part.startsWith('url '));
    if (!urlPart) continue;
    const url = urlPart.slice(4).trim();
    if (url) return url;
  }
  return undefined;
}

function parsePattern(raw: string | undefined): BlobbiPattern | undefined {
  if (raw === 'solid' || raw === 'spotted' || raw === 'striped' || raw === 'gradient') {
    return raw;
  }
  return undefined;
}

function parseSpecialMark(raw: string | undefined): BlobbiSpecialMark | undefined {
  if (raw === 'none' || raw === 'star' || raw === 'heart' || raw === 'sparkle' || raw === 'blush') {
    return raw;
  }
  return undefined;
}

function parseSize(raw: string | undefined): BlobbiSize | undefined {
  if (raw === 'small' || raw === 'medium' || raw === 'large') return raw;
  return undefined;
}

export function parseBlobbiState(event: NostrEvent): BlobbiSnapshot | null {
  if (event.kind !== BLOBBI_STATE_KIND) return null;
  const d = tagValue(event, 'd')?.trim();
  if (!d) return null;

  const content = event.content.trim();
  const stage = tagValue(event, 'stage')?.trim() || 'unknown';
  const nameTag = tagValue(event, 'name')?.trim();
  const displayName =
    nameTag ||
    content.split(/\s+is\s+/i)[0]?.trim() ||
    d.replace(/^blobbi-?/i, '').replace(/-/g, ' ') ||
    d;

  return {
    id: d,
    ownerPubkey: event.pubkey,
    stage,
    health: parseStat(tagValue(event, 'health'), 1),
    hunger: parseStat(tagValue(event, 'hunger')),
    happiness: parseStat(tagValue(event, 'happiness')),
    hygiene: parseStat(tagValue(event, 'hygiene')),
    energy: parseStat(tagValue(event, 'energy')),
    seed: tagValue(event, 'seed'),
    baseColor: tagValue(event, 'base_color'),
    secondaryColor: tagValue(event, 'secondary_color'),
    eyeColor: tagValue(event, 'eye_color'),
    pattern: parsePattern(tagValue(event, 'pattern')),
    specialMark: parseSpecialMark(tagValue(event, 'special_mark')),
    size: parseSize(tagValue(event, 'size')),
    imageUrl: parseImetaImageUrl(event),
    personality: tagValue(event, 'personality'),
    displayName,
    content,
    dittoPageUrl: dittoNaddrUrl({
      kind: BLOBBI_STATE_KIND,
      pubkey: event.pubkey,
      identifier: d,
    }),
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
