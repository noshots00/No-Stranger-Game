import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import {
  MARKET_COMMUNITY_TAG,
  MARKET_LISTING_D_PREFIX,
  MARKET_LISTING_QUERY_LIMIT,
  MARKET_LISTING_TAG,
  NSG_MARKET_LISTING_KIND,
  type MarketListingStatus,
} from './constants';

export type MarketListingView = {
  listingId: string;
  eventId: string;
  pubkey: string;
  itemLabel: string;
  itemKey: string;
  itemQty: number;
  priceCopper: number;
  status: MarketListingStatus;
  sellerName: string;
  buyerPubkey?: string;
  buyerName?: string;
  createdAt: number;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

export function newMarketListingId(): string {
  return `${MARKET_LISTING_D_PREFIX}${crypto.randomUUID()}`;
}

export function parseMarketListing(event: NostrEvent): MarketListingView | null {
  if (event.kind !== NSG_MARKET_LISTING_KIND) return null;
  const d = tagValue(event, 'd');
  if (!d?.startsWith(MARKET_LISTING_D_PREFIX)) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === MARKET_LISTING_TAG)) return null;

  const itemLabel = tagValue(event, 'item-label')?.trim();
  const priceCopper = Number.parseInt(tagValue(event, 'price-copper') ?? '', 10);
  const sellerName = tagValue(event, 'seller-name')?.trim() ?? 'Stranger';
  const statusRaw = tagValue(event, 'status');
  const status: MarketListingStatus =
    statusRaw === 'sold' || statusRaw === 'cancelled' ? statusRaw : 'open';

  if (!itemLabel || !Number.isFinite(priceCopper) || priceCopper < 0) return null;

  const itemKey = tagValue(event, 'item-key')?.trim() ?? '';
  const itemQty = Number.parseInt(tagValue(event, 'item-qty') ?? '1', 10);

  return {
    listingId: d,
    eventId: event.id,
    pubkey: event.pubkey,
    itemLabel,
    itemKey,
    itemQty: Number.isFinite(itemQty) ? Math.max(1, itemQty) : 1,
    priceCopper: Math.floor(priceCopper),
    status,
    sellerName,
    buyerPubkey: tagValue(event, 'buyer'),
    buyerName: tagValue(event, 'buyer-name'),
    createdAt: event.created_at,
  };
}

export const marketListingFilter = (): NostrFilter => ({
  kinds: [NSG_MARKET_LISTING_KIND],
  '#t': [MARKET_LISTING_TAG],
  limit: MARKET_LISTING_QUERY_LIMIT,
});

/** Latest event per listing `d` tag, newest posted first. */
export function latestMarketListings(events: readonly NostrEvent[]): MarketListingView[] {
  const byD = new Map<string, { listing: MarketListingView; createdAt: number }>();
  for (const event of events) {
    const listing = parseMarketListing(event);
    if (!listing) continue;
    const prev = byD.get(listing.listingId);
    if (!prev || event.created_at >= prev.createdAt) {
      byD.set(listing.listingId, { listing, createdAt: event.created_at });
    }
  }
  return Array.from(byD.values())
    .map((e) => e.listing)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function buildMarketListingDraft(args: {
  listingId: string;
  itemLabel: string;
  itemKey?: string;
  itemQty: number;
  priceCopper: number;
  sellerName: string;
  status?: MarketListingStatus;
  buyerPubkey?: string;
  buyerName?: string;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  const tags: string[][] = [
    ['d', args.listingId],
    ['t', MARKET_COMMUNITY_TAG],
    ['t', MARKET_LISTING_TAG],
    ['item-label', args.itemLabel],
    ['item-qty', String(Math.max(1, args.itemQty))],
    ['price-copper', String(Math.max(0, args.priceCopper))],
    ['status', args.status ?? 'open'],
    ['seller-name', args.sellerName],
    ['alt', 'Player market listing for No Stranger Game'],
  ];
  if (args.itemKey) tags.push(['item-key', args.itemKey]);
  if (args.buyerPubkey) tags.push(['buyer', args.buyerPubkey]);
  if (args.buyerName) tags.push(['buyer-name', args.buyerName]);

  return {
    kind: NSG_MARKET_LISTING_KIND,
    content: '',
    created_at,
    tags,
  };
}
