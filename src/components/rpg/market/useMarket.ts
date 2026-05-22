import { useCallback, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { toItemLabel } from '../helpers';
import { applyListEscrow, applyPurchase, reconcileSellerPayouts, refundListingEscrow, type PostListingInput } from './listingEscrow';
import {
  buildMarketListingDraft,
  latestMarketListings,
  marketListingFilter,
  newMarketListingId,
  type MarketListingView,
} from './marketListingNostr';
import { MARKET_FEED_STALE_MS } from './constants';
import type { QuestState } from '../quests/types';

const MARKET_FEED_KEY = ['market-listings'] as const;

export type MarketFeed = {
  openListings: MarketListingView[];
  allListings: MarketListingView[];
};

async function fetchMarketFeed(
  nostr: { query: (f: ReturnType<typeof marketListingFilter>[]) => Promise<unknown[]> }
): Promise<MarketFeed> {
  const events = (await nostr.query([marketListingFilter()])) as NostrEvent[];
  const allListings = latestMarketListings(events);
  const openListings = allListings.filter((l) => l.status === 'open');
  return { openListings, allListings };
}

export function useMarket(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
  setQuestState: React.Dispatch<React.SetStateAction<QuestState>>;
  persistQuestCheckpoint: (state: QuestState) => void | Promise<void>;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: MARKET_FEED_KEY,
    queryFn: () => fetchMarketFeed(nostr),
    enabled: args.enabled,
    staleTime: MARKET_FEED_STALE_MS,
    refetchInterval: args.enabled ? MARKET_FEED_STALE_MS : false,
  });

  const feed = feedQuery.data ?? { openListings: [], allListings: [] };

  const { enabled, myPubkey, setQuestState, persistQuestCheckpoint } = args;

  useEffect(() => {
    if (!enabled || !feedQuery.data || !myPubkey) return;
    setQuestState((prev) => {
      const next = reconcileSellerPayouts(prev, feedQuery.data.allListings, myPubkey);
      if (next === prev) return prev;
      void persistQuestCheckpoint(next);
      return next;
    });
  }, [enabled, myPubkey, feedQuery.data, setQuestState, persistQuestCheckpoint]);

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: MARKET_FEED_KEY });
  }, [queryClient]);

  const postListing = useMutation({
    mutationFn: async (input: { goods: PostListingInput; priceCopper: number }) => {
      if (!args.myPubkey) throw new Error('You must be logged in to list an item.');

      const listingId = newMarketListingId();
      const outcome = { error: null as string | null, next: null as QuestState | null, sellerName: 'Stranger' };

      args.setQuestState((prev) => {
        outcome.sellerName = prev.playerName.trim() || 'Stranger';
        const escrowResult = applyListEscrow(prev, listingId, input.goods, input.priceCopper);
        if ('error' in escrowResult) {
          outcome.error = escrowResult.error;
          return prev;
        }
        outcome.next = escrowResult.state;
        return escrowResult.state;
      });

      if (outcome.error) throw new Error(outcome.error);
      if (!outcome.next) throw new Error('Failed to escrow item.');

      const itemLabel =
        input.goods.questItemLabel ??
        (input.goods.modifierItemKey ? toItemLabel(input.goods.modifierItemKey) : 'Item');

      await publish(
        buildMarketListingDraft({
          listingId,
          itemLabel,
          itemKey: input.goods.modifierItemKey,
          itemQty: input.goods.modifierItemQty ?? 1,
          priceCopper: input.priceCopper,
          sellerName: outcome.sellerName,
          status: 'open',
        })
      );

      void args.persistQuestCheckpoint(outcome.next);
      return listingId;
    },
    onSuccess: () => invalidateFeed(),
  });

  const cancelListing = useMutation({
    mutationFn: async (listing: MarketListingView) => {
      if (!args.myPubkey || listing.pubkey !== args.myPubkey) {
        throw new Error('Only the seller can cancel this listing.');
      }
      const outcome = { next: null as QuestState | null };
      args.setQuestState((prev) => {
        outcome.next = refundListingEscrow(prev, listing.listingId);
        return outcome.next;
      });
      if (!outcome.next) throw new Error('Failed to cancel listing.');
      void args.persistQuestCheckpoint(outcome.next);

      await publish(
        buildMarketListingDraft({
          listingId: listing.listingId,
          itemLabel: listing.itemLabel,
          itemKey: listing.itemKey || undefined,
          itemQty: listing.itemQty,
          priceCopper: listing.priceCopper,
          sellerName: listing.sellerName,
          status: 'cancelled',
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  const buyListing = useMutation({
    mutationFn: async (listing: MarketListingView) => {
      if (!args.myPubkey) throw new Error('You must be logged in to buy.');
      if (listing.pubkey === args.myPubkey) throw new Error('You cannot buy your own listing.');

      const outcome = { error: null as string | null, next: null as QuestState | null };
      args.setQuestState((prev) => {
        const purchaseResult = applyPurchase(prev, listing);
        if ('error' in purchaseResult) {
          outcome.error = purchaseResult.error;
          return prev;
        }
        outcome.next = purchaseResult.state;
        return purchaseResult.state;
      });

      if (outcome.error) throw new Error(outcome.error);
      if (!outcome.next) throw new Error('Failed to complete purchase.');

      const buyerName = outcome.next.playerName.trim() || 'Stranger';
      await publish(
        buildMarketListingDraft({
          listingId: listing.listingId,
          itemLabel: listing.itemLabel,
          itemKey: listing.itemKey || undefined,
          itemQty: listing.itemQty,
          priceCopper: listing.priceCopper,
          sellerName: listing.sellerName,
          status: 'sold',
          buyerPubkey: args.myPubkey,
          buyerName,
        })
      );

      void args.persistQuestCheckpoint(outcome.next);
    },
    onSuccess: () => invalidateFeed(),
  });

  return {
    feedQuery,
    feed,
    postListing,
    cancelListing,
    buyListing,
    invalidateFeed,
  };
}
