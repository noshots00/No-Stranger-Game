import { useState } from 'react';
import { cn } from '@/lib/utils';
import { VillageLocationScreen } from '../village/VillageLocationScreen';
import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_CAPTION,
  RPG_UI_META,
} from '../typography/rpgUiTypography';
import { VillageActionChip, VillageActionRow, VillageActionRowItem } from '../village/VillageActionChip';
import { useToast } from '@/hooks/useToast';
import { formatCoinShort, getCopperFromModifiers, splitCopperIntoCoins } from '../helpers';
import { formatListingItem, formatListingPrice } from './listingEscrow';
import { PostListingDialog } from './PostListingDialog';
import { VILLAGE_MARKET_SUPPLIES, villageSupplyBuyDelta } from './villageSupplies';
import type { MarketListingView } from './marketListingNostr';
import type { useMarket } from './useMarket';
import type { ModifierMap, QuestState } from '../quests/types';

type MarketScreenProps = {
  className?: string;
  onClose: () => void;
  questState: QuestState;
  myPubkey: string | undefined;
  market: ReturnType<typeof useMarket>;
  onApplyModifiers: (delta: ModifierMap) => void;
};

function formatPostedDate(createdAt: number): string {
  return new Date(createdAt * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ListingRow({
  listing,
  myPubkey,
  walletCopper,
  onBuy,
  onCancel,
  isBuyPending,
  isCancelPending,
}: {
  listing: MarketListingView;
  myPubkey: string | undefined;
  walletCopper: number;
  onBuy: () => void;
  onCancel: () => void;
  isBuyPending: boolean;
  isCancelPending: boolean;
}) {
  const isSeller = myPubkey === listing.pubkey;
  const canAfford = walletCopper >= listing.priceCopper;

  return (
    <li className="border-b border-[var(--candle-rule)]/50 py-1 last:border-b-0">
      <p className={cn(RPG_UI_CAPTION, 'leading-relaxed text-[var(--candle-ink-soft)]')}>
        <span className="text-[var(--candle-ink-faint)]">{formatPostedDate(listing.createdAt)}</span>
        {' · '}
        <span className="text-[var(--candle-ink-faint)]">{listing.sellerName}</span>
        {' · '}
        {formatListingItem(listing)}
        {' · '}
        <span className="text-[var(--candle-wax)]">{formatListingPrice(listing)}</span>
      </p>
      <VillageActionRow className="mt-0.5">
        <VillageActionRowItem>
          {isSeller ? (
            <VillageActionChip disabled={isCancelPending} onClick={onCancel}>
              {isCancelPending ? 'Cancelling…' : 'Cancel listing'}
            </VillageActionChip>
          ) : (
            <VillageActionChip
              className={!canAfford ? 'line-through opacity-50' : undefined}
              disabled={!canAfford || isBuyPending || !myPubkey}
              onClick={onBuy}
            >
              {isBuyPending ? 'Buying…' : 'Buy'}
            </VillageActionChip>
          )}
        </VillageActionRowItem>
      </VillageActionRow>
    </li>
  );
}

export function MarketScreen({
  className,
  onClose,
  questState,
  myPubkey,
  market,
  onApplyModifiers,
}: MarketScreenProps) {
  const { toast } = useToast();
  const [postOpen, setPostOpen] = useState(false);
  const { feed, feedQuery, postListing, cancelListing, buyListing } = market;
  const walletCopper = getCopperFromModifiers(questState.modifiers);

  return (
    <>
      <VillageLocationScreen
        panel="market"
        className={className}
        onClose={onClose}
        footer={
          <li>
            <button
              type="button"
              className={RPG_COMMAND_CHIP}
              disabled={!myPubkey}
              onClick={() => setPostOpen(true)}
            >
              <span className={RPG_COMMAND_CHIP_LABEL}>List item for sale</span>
            </button>
          </li>
        }
      >
        <p className={cn(RPG_UI_CAPTION, 'text-center')}>
          Listings newest first · you have {formatCoinShort(splitCopperIntoCoins(walletCopper))}
        </p>

        <section className="space-y-0.5">
          <p className={cn(RPG_UI_CAPTION, 'uppercase tracking-[0.14em]')}>
            Village supplies (always in stock)
          </p>
          <ul className="list-none space-y-0.5 rounded-md border border-[var(--candle-rule)]/60 bg-black/25 px-2 py-1">
            {VILLAGE_MARKET_SUPPLIES.map((good) => {
              const canAfford = walletCopper >= good.priceCopper;
              return (
                <li
                  key={good.itemKey}
                  className="flex items-center justify-between gap-2 border-b border-[var(--candle-rule)]/30 py-1 last:border-b-0"
                >
                  <span className={RPG_UI_CAPTION}>
                    {good.label} · {formatCoinShort(splitCopperIntoCoins(good.priceCopper))}
                  </span>
                  <VillageActionChip
                    disabled={!myPubkey || !canAfford}
                    onClick={() => {
                      if (!canAfford) {
                        toast({
                          title: 'Not enough coin',
                          description: formatCoinShort(splitCopperIntoCoins(good.priceCopper)),
                        });
                        return;
                      }
                      onApplyModifiers(villageSupplyBuyDelta(good));
                      toast({ title: 'Purchased', description: good.label });
                    }}
                  >
                    Buy
                  </VillageActionChip>
                </li>
              );
            })}
          </ul>
        </section>

        <p className={cn(RPG_UI_CAPTION, 'uppercase tracking-[0.14em]')}>Player listings</p>

        <div className="rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
          {feedQuery.isPending ? (
            <p className={cn(RPG_UI_META, 'py-3 text-center')}>Loading…</p>
          ) : feed.openListings.length === 0 ? (
            <p className={cn(RPG_UI_META, 'py-3 text-center')}>No player listings yet.</p>
          ) : (
            <ul className="list-none px-2 py-1">
              {feed.openListings.map((listing) => (
                <ListingRow
                  key={listing.listingId}
                  listing={listing}
                  myPubkey={myPubkey}
                  walletCopper={walletCopper}
                  isBuyPending={buyListing.isPending}
                  isCancelPending={cancelListing.isPending}
                  onBuy={() =>
                    buyListing.mutate(listing, {
                      onSuccess: () =>
                        toast({
                          title: 'Purchased',
                          description: formatListingItem(listing),
                        }),
                      onError: (err) =>
                        toast({
                          title: 'Purchase failed',
                          description: err instanceof Error ? err.message : 'Try again.',
                        }),
                    })
                  }
                  onCancel={() =>
                    cancelListing.mutate(listing, {
                      onSuccess: () =>
                        toast({ title: 'Listing cancelled', description: 'Item returned from escrow.' }),
                      onError: (err) =>
                        toast({
                          title: 'Cancel failed',
                          description: err instanceof Error ? err.message : 'Try again.',
                        }),
                    })
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </VillageLocationScreen>

      <PostListingDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        questState={questState}
        isPending={postListing.isPending}
        onSubmit={(payload) =>
          postListing.mutate(payload, {
            onSuccess: () => {
              setPostOpen(false);
              toast({ title: 'Listed', description: 'Item held in escrow until sold or cancelled.' });
            },
            onError: (err) =>
              toast({
                title: 'Could not list',
                description: err instanceof Error ? err.message : 'Try again.',
              }),
          })
        }
      />
    </>
  );
}
