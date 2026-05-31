import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import {
  NSG_VILLAGE_LOT_KIND,
  VILLAGE_LOT_COMMUNITY_TAG,
  VILLAGE_LOT_D_PREFIX,
  VILLAGE_LOT_QUERY_LIMIT,
  VILLAGE_LOT_TAG,
  type VillageLotStatus,
} from './constants';
import type { VillageBusinessType } from './villageCatalog';
import { CLAIMABLE_VILLAGE_LOT_IDS } from './villageCatalog';

export type VillageLotOccupancyView = {
  lotId: string;
  districtId: string;
  ownerPubkey: string;
  ownerName: string;
  businessName: string;
  businessType: VillageBusinessType;
  status: VillageLotStatus;
  eventId: string;
  updatedAt: number;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

const isBusinessType = (value: string | undefined): value is VillageBusinessType =>
  value === 'tavern' || value === 'shop' || value === 'workshop';

export function villageLotFilter(): NostrFilter {
  return {
    kinds: [NSG_VILLAGE_LOT_KIND],
    '#t': [VILLAGE_LOT_TAG],
    limit: VILLAGE_LOT_QUERY_LIMIT,
  };
}

export function parseVillageLotEvent(event: NostrEvent): VillageLotOccupancyView | null {
  if (event.kind !== NSG_VILLAGE_LOT_KIND) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === VILLAGE_LOT_TAG)) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === VILLAGE_LOT_COMMUNITY_TAG)) return null;

  const d = tagValue(event, 'd');
  const lotId = tagValue(event, 'lot-id')?.trim() ?? d?.replace(VILLAGE_LOT_D_PREFIX, '');
  const districtId = tagValue(event, 'district-id')?.trim();
  const statusRaw = tagValue(event, 'status')?.trim();
  const businessName = tagValue(event, 'business-name')?.trim();
  const businessTypeRaw = tagValue(event, 'business-type')?.trim();
  const ownerName = tagValue(event, 'owner-name')?.trim() ?? 'Stranger';

  if (!lotId || !districtId || !businessName || !isBusinessType(businessTypeRaw)) return null;
  if (statusRaw !== 'claimed' && statusRaw !== 'built') return null;
  if (!CLAIMABLE_VILLAGE_LOT_IDS.has(lotId)) return null;

  return {
    lotId,
    districtId,
    ownerPubkey: event.pubkey,
    ownerName,
    businessName,
    businessType: businessTypeRaw,
    status: statusRaw,
    eventId: event.id,
    updatedAt: event.created_at,
  };
}

/**
 * For each lot-id, earliest claim across authors wins; winning owner's latest event sets status.
 */
export function mergeVillageLotState(events: readonly NostrEvent[]): Map<string, VillageLotOccupancyView> {
  const parsed = events
    .map(parseVillageLotEvent)
    .filter((row): row is VillageLotOccupancyView => row !== null);

  const latestByLotAndAuthor = new Map<string, VillageLotOccupancyView>();
  const firstClaimByLotAndAuthor = new Map<string, VillageLotOccupancyView>();

  for (const row of parsed) {
    const key = `${row.lotId}:${row.ownerPubkey}`;
    const prevLatest = latestByLotAndAuthor.get(key);
    if (!prevLatest || row.updatedAt >= prevLatest.updatedAt) {
      latestByLotAndAuthor.set(key, row);
    }
    const prevFirst = firstClaimByLotAndAuthor.get(key);
    if (!prevFirst || row.updatedAt < prevFirst.updatedAt) {
      firstClaimByLotAndAuthor.set(key, row);
    }
  }

  const firstClaimPerAuthorByLot = new Map<string, Map<string, VillageLotOccupancyView>>();
  for (const [, first] of firstClaimByLotAndAuthor) {
    const lotId = first.lotId;
    const pubkey = first.ownerPubkey;
    let authors = firstClaimPerAuthorByLot.get(lotId);
    if (!authors) {
      authors = new Map();
      firstClaimPerAuthorByLot.set(lotId, authors);
    }
    authors.set(pubkey, first);
  }

  const result = new Map<string, VillageLotOccupancyView>();
  for (const [lotId, authors] of firstClaimPerAuthorByLot) {
    let winnerPubkey: string | null = null;
    let winnerFirstAt = Infinity;
    for (const [pubkey, first] of authors) {
      if (first.updatedAt < winnerFirstAt) {
        winnerFirstAt = first.updatedAt;
        winnerPubkey = pubkey;
      }
    }
    if (!winnerPubkey) continue;
    const winnerState = latestByLotAndAuthor.get(`${lotId}:${winnerPubkey}`);
    if (winnerState) result.set(lotId, winnerState);
  }

  return result;
}

export function buildVillageLotDraft(args: {
  lotId: string;
  districtId: string;
  status: VillageLotStatus;
  businessName: string;
  businessType: VillageBusinessType;
  ownerName: string;
}): Omit<NostrEvent, 'id' | 'sig' | 'pubkey' | 'created_at'> {
  const statusLabel = args.status === 'built' ? 'built' : 'claimed';
  return {
    kind: NSG_VILLAGE_LOT_KIND,
    content: '',
    tags: [
      ['d', `${VILLAGE_LOT_D_PREFIX}${args.lotId}`],
      ['t', VILLAGE_LOT_COMMUNITY_TAG],
      ['t', VILLAGE_LOT_TAG],
      ['lot-id', args.lotId],
      ['district-id', args.districtId],
      ['status', statusLabel],
      ['business-name', args.businessName.trim()],
      ['business-type', args.businessType],
      ['owner-name', args.ownerName.trim() || 'Stranger'],
      ['alt', `Village lot ${statusLabel} for No Stranger Game`],
    ],
  };
}

export function buildVillageLotClaimDraft(args: {
  lotId: string;
  districtId: string;
  businessName: string;
  businessType: VillageBusinessType;
  ownerName: string;
}): Omit<NostrEvent, 'id' | 'sig' | 'pubkey' | 'created_at'> {
  return buildVillageLotDraft({ ...args, status: 'claimed' });
}

export function buildVillageLotBuildDraft(args: {
  lotId: string;
  districtId: string;
  businessName: string;
  businessType: VillageBusinessType;
  ownerName: string;
}): Omit<NostrEvent, 'id' | 'sig' | 'pubkey' | 'created_at'> {
  return buildVillageLotDraft({ ...args, status: 'built' });
}
