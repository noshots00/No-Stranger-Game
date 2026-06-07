import { useCallback, useEffect, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { toItemLabel } from '../helpers';
import {
  applyListEscrow,
  applyPurchase,
  reconcileSellerPayouts,
  refundListingEscrow,
  type PostListingInput,
} from './listingEscrow';
import {
  buildMarketListingDraft,
  latestMarketListings,
  marketListingFilter,
  newMarketListingId,
  type MarketListingView,
} from './marketListingNostr';
import type { QuestState } from '../quests/types';

const MARKET_FEED_KEY = ['market-listings'] as const;
const UNPUBLISHED_ESCROW_RECOVERY_MS = 25_000;

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
  getQuestState: () => QuestState;
  setQuestState: React.Dispatch<React.SetStateAction<QuestState>>;
  persistQuestCheckpoint: (state: QuestState) => void | Promise<void>;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();

  const { enabled, myPubkey, getQuestState, setQuestState, persistQuestCheckpoint } = args;

  const feedQuery = useQuery({
    queryKey: MARKET_FEED_KEY,
    queryFn: () => fetchMarketFeed(nostr),
    enabled,
    staleTime: Infinity,
  });

  const feed = feedQuery.data ?? { openListings: [], allListings: [] };

  const publishedListingIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !feedQuery.data || !myPubkey) return;
    setQuestState((prev) => {
      const next = reconcileSellerPayouts(prev, feedQuery.data.allListings, myPubkey);
      if (next === prev) return prev;
      window.queueMicrotask(() => void persistQuestCheckpoint(next));
      return next;
    });
  }, [enabled, myPubkey, feedQuery.data, setQuestState, persistQuestCheckpoint]);

  /** Refund escrow rows that never appeared on relays (e.g. after a failed publish). */
  useEffect(() => {
    if (!enabled || !feedQuery.isFetched || !myPubkey) return;

    const timer = window.setTimeout(() => {
      const myListingIds = new Set(
        feed.allListings.filter((l) => l.pubkey === myPubkey).map((l) => l.listingId)
      );
      for (const id of publishedListingIdsRef.current) myListingIds.add(id);

      const escrowIds = Object.keys(getQuestState().marketEscrowByListingId ?? {});
      const orphans = escrowIds.filter((id) => !myListingIds.has(id));
      if (orphans.length === 0) return;

      setQuestState((prev) => {
        let next = prev;
        for (const id of orphans) next = refundListingEscrow(next, id);
        if (next === prev) return prev;
        void persistQuestCheckpoint(next);
        return next;
      });
    }, UNPUBLISHED_ESCROW_RECOVERY_MS);

    return () => window.clearTimeout(timer);
  }, [
    enabled,
    myPubkey,
    getQuestState,
    setQuestState,
    persistQuestCheckpoint,
    feed.allListings,
    feedQuery.isFetched,
    feedQuery.dataUpdatedAt,
  ]);

  const refreshFeed = useCallback(() => {
    void feedQuery.refetch();
  }, [feedQuery]);

  const postListing = useMutation({
    mutationFn: async (input: { goods: PostListingInput; priceCopper: number }) => {
      if (!myPubkey) throw new Error('You must be logged in to list an item.');

      const listingId = newMarketListingId();
      const beforePost = getQuestState();
      const sellerName = beforePost.playerName.trim() || 'Stranger';
      const escrowResult = applyListEscrow(beforePost, listingId, input.goods, input.priceCopper);
      if ('error' in escrowResult) throw new Error(escrowResult.error);

      const nextState = escrowResult.state;
      setQuestState(nextState);

      const itemLabel =
        input.goods.questItemLabel ??
        (input.goods.modifierItemKey ? toItemLabel(input.goods.modifierItemKey) : 'Item');

      try {
        await publish(
          buildMarketListingDraft({
            listingId,
            itemLabel,
            itemKey: input.goods.modifierItemKey,
            itemQty: input.goods.modifierItemQty ?? 1,
            priceCopper: input.priceCopper,
            sellerName,
            status: 'open',
          })
        );
      } catch (error) {
        const refunded = refundListingEscrow(nextState, listingId);
        setQuestState(refunded);
        await persistQuestCheckpoint(refunded);
        throw error;
      }

      publishedListingIdsRef.current.add(listingId);
      await persistQuestCheckpoint(nextState);
      return listingId;
    },
    onSuccess: () => void feedQuery.refetch(),
  });

  const cancelListing = useMutation({
    mutationFn: async (listing: MarketListingView) => {
      if (!myPubkey || listing.pubkey !== myPubkey) {
        throw new Error('Only the seller can cancel this listing.');
      }
      const refunded = refundListingEscrow(getQuestState(), listing.listingId);
      setQuestState(refunded);
      await persistQuestCheckpoint(refunded);

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
    onSuccess: () => void feedQuery.refetch(),
  });

  const buyListing = useMutation({
    mutationFn: async (listing: MarketListingView) => {
      if (!myPubkey) throw new Error('You must be logged in to buy.');
      if (listing.pubkey === myPubkey) throw new Error('You cannot buy your own listing.');

      const beforeBuy = getQuestState();
      const purchaseResult = applyPurchase(beforeBuy, listing);
      if ('error' in purchaseResult) throw new Error(purchaseResult.error);

      const nextState = purchaseResult.state;
      setQuestState(nextState);

      const buyerName = nextState.playerName.trim() || 'Stranger';
      try {
        await publish(
          buildMarketListingDraft({
            listingId: listing.listingId,
            itemLabel: listing.itemLabel,
            itemKey: listing.itemKey || undefined,
            itemQty: listing.itemQty,
            priceCopper: listing.priceCopper,
            sellerName: listing.sellerName,
            status: 'sold',
            buyerPubkey: myPubkey,
            buyerName,
          })
        );
      } catch (error) {
        setQuestState(beforeBuy);
        await persistQuestCheckpoint(beforeBuy);
        throw error;
      }

      await persistQuestCheckpoint(nextState);
    },
    onSuccess: () => void feedQuery.refetch(),
  });

  return {
    feedQuery,
    feed,
    postListing,
    cancelListing,
    buyListing,
    refreshFeed,
  };
}
