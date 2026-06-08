import { useState } from 'react';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { PanelUpdateButton } from '../PanelUpdateButton';
import { Button } from '@/components/ui/button';
import { GamePanelScroll } from '../GamePanelScroll';
import { cn } from '@/lib/utils';
import { formatCoinShort, getCopperFromModifiers, splitCopperIntoCoins } from '../helpers';
import { ItemName } from '../items/ItemName';
import { formatListingPrice } from './listingEscrow';
import { PostListingDialog } from './PostListingDialog';
import { VILLAGE_MARKET_SUPPLIES, villageSupplyBuyDelta } from './villageSupplies';
import type { MarketListingView } from './marketListingNostr';
import type { useMarket } from './useMarket';
import type { ModifierMap, QuestState } from '../quests/types';

type MarketPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <li className="border-b border-[var(--candle-rule)]/50 py-2 font-serif text-xs leading-relaxed text-[var(--candle-ink-soft)] last:border-b-0">
      <p className="text-[var(--candle-wax)]">
        <span className="text-[var(--candle-ink-faint)]">{formatPostedDate(listing.createdAt)}</span>
        {' · '}
        <span className="text-[var(--candle-ink-faint)]">{listing.sellerName}</span>
        {' · '}
        <ItemName
          label={listing.itemLabel}
          itemKey={listing.itemKey || undefined}
          category={listing.itemKey ? undefined : 'quest'}
        />
        {listing.itemQty > 1 ? ` ×${listing.itemQty}` : ''}
        {' · '}
        <span className="text-[var(--candle-wax)]">{formatListingPrice(listing)}</span>
      </p>
      {isSeller ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-1.5 h-7 font-serif text-[0.65rem]"
          disabled={isCancelPending}
          onClick={onCancel}
        >
          {isCancelPending ? 'Cancelling…' : 'Cancel listing'}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          className={cn('mt-1.5 h-7 font-serif text-[0.65rem]', !canAfford && 'line-through opacity-50')}
          disabled={!canAfford || isBuyPending || !myPubkey}
          onClick={onBuy}
        >
          {isBuyPending ? 'Buying…' : 'Buy'}
        </Button>
      )}
    </li>
  );
}

export function MarketPanel({
  open,
  onOpenChange,
  questState,
  myPubkey,
  market,
  onApplyModifiers,
}: MarketPanelProps) {
  const [postOpen, setPostOpen] = useState(false);
  const { feed, feedQuery, postListing, cancelListing, buyListing, refreshFeed } = market;
  const walletCopper = getCopperFromModifiers(questState.modifiers);

  return (
    <>
      <GamePanelDialog open={open} onOpenChange={onOpenChange} ariaLabel="Market" panelClassName="gap-0 p-4 pt-8">
        <header className="shrink-0 space-y-1 px-2 text-center">
          <GamePanelDialogTitle>Market</GamePanelDialogTitle>
          <p className="font-serif text-xs text-[var(--candle-ink-faint)]">
            Listings newest first · you have{' '}
            {formatCoinShort(splitCopperIntoCoins(walletCopper))}
          </p>
        </header>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1">
            <section className="shrink-0 space-y-2">
              <p className="px-1 font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                Village supplies (always in stock)
              </p>
              <ul className="list-none space-y-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/25 px-2 py-2">
                {VILLAGE_MARKET_SUPPLIES.map((good) => {
                  const canAfford = walletCopper >= good.priceCopper;
                  return (
                    <li
                      key={good.itemKey}
                      className="flex items-center justify-between gap-2 border-b border-[var(--candle-rule)]/30 py-1.5 font-serif text-xs last:border-b-0"
                    >
                      <span className="text-[var(--candle-ink-soft)]">
                        <ItemName label={good.label} itemKey={good.itemKey} />
                        {' · '}
                        {formatCoinShort(splitCopperIntoCoins(good.priceCopper))}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 font-serif text-[0.65rem]"
                        disabled={!myPubkey || !canAfford}
                        onClick={() => {
                          if (!canAfford) return;
                          onApplyModifiers(villageSupplyBuyDelta(good));
                        }}
                      >
                        Buy
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <p className="shrink-0 px-1 font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
              Player listings
            </p>

            <PanelUpdateButton
              label="Update listings"
              variant="full"
              onClick={() => refreshFeed()}
            />

            <GamePanelScroll className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
              {feedQuery.isPending ? (
                <p className="py-6 text-center font-serif text-sm text-[var(--candle-ink-faint)]">Loading…</p>
              ) : feed.openListings.length === 0 ? (
                <p className="py-6 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                  No player listings yet.
                </p>
              ) : (
                <ul className="list-none px-3 py-2">
                  {feed.openListings.map((listing) => (
                    <ListingRow
                      key={listing.listingId}
                      listing={listing}
                      myPubkey={myPubkey}
                      walletCopper={walletCopper}
                      isBuyPending={buyListing.isPending}
                      isCancelPending={cancelListing.isPending}
                      onBuy={() => buyListing.mutate(listing)}
                      onCancel={() => cancelListing.mutate(listing)}
                    />
                  ))}
                </ul>
              )}
            </GamePanelScroll>

            <Button
              type="button"
              className="shrink-0 font-serif uppercase tracking-[0.1em]"
              disabled={!myPubkey}
              onClick={() => setPostOpen(true)}
            >
              List item for sale
            </Button>
        </div>
      </GamePanelDialog>

      <PostListingDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        questState={questState}
        isPending={postListing.isPending}
        onSubmit={(payload) =>
          postListing.mutate(payload, {
            onSuccess: () => setPostOpen(false),
          })
        }
      />
    </>
  );
}
