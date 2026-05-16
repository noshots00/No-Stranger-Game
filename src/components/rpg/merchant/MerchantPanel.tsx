import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ModifierMap } from '@/components/rpg/quests/types';
import { formatCoinShort, splitCopperIntoCoins } from '@/components/rpg/helpers';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/utils';
import {
  MERCHANT_GOLD_STIPEND_DELTA,
  WOLF_PELT_PRICE_COPPER,
  buyWolfPeltDelta,
  sellWolfPeltDelta,
} from '@/components/rpg/merchant/merchantEconomy';

const MERCHANT_PORTRAIT_SRC = publicAsset(
  'art/converted/batch-2026-05-02_21-10-35/the-ogre-king.webp'
);

const priceLabel = formatCoinShort(splitCopperIntoCoins(WOLF_PELT_PRICE_COPPER));

type MerchantPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletCopper: number;
  wolfPelts: number;
  /** Apply trade or stipend; parent persists. */
  onApplyModifiers: (delta: ModifierMap) => void;
};

export function MerchantPanel({
  open,
  onOpenChange,
  walletCopper,
  wolfPelts,
  onApplyModifiers,
}: MerchantPanelProps) {
  const [talkLine, setTalkLine] = useState<string | null>(null);
  const canBuy = walletCopper >= WOLF_PELT_PRICE_COPPER;
  const canSell = wolfPelts >= 1;

  const handleStipend = () => {
    onApplyModifiers(MERCHANT_GOLD_STIPEND_DELTA);
    setTalkLine('The Merchant tosses you a heavy little purse. “Spend it wisely.”');
  };

  const handleBuy = () => {
    if (!canBuy) return;
    setTalkLine(null);
    onApplyModifiers(buyWolfPeltDelta());
  };

  const handleSell = () => {
    if (!canSell) return;
    setTalkLine(null);
    onApplyModifiers(sellWolfPeltDelta());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[min(90vh,640px)] max-w-[min(96vw,28rem)] overflow-y-auto border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
          'data-[state=open]:slide-in-from-bottom-2'
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
            Merchant
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <img
              src={MERCHANT_PORTRAIT_SRC}
              alt="The Merchant"
              className="aspect-[3/4] w-[min(140px,38vw)] rounded-md border border-[var(--candle-rule)] object-cover shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Tabs defaultValue="talk" className="w-full">
              <TabsList className="h-9 w-full justify-stretch rounded-md border border-[var(--candle-rule)] bg-black/30 p-0.5">
                <TabsTrigger
                  value="talk"
                  className="flex-1 font-serif text-xs uppercase tracking-[0.14em] text-[var(--candle-ink-soft)] data-[state=active]:bg-[var(--candle-flame)]/15 data-[state=active]:text-[var(--candle-ink)]"
                >
                  Talk
                </TabsTrigger>
                <TabsTrigger
                  value="shop"
                  className="flex-1 font-serif text-xs uppercase tracking-[0.14em] text-[var(--candle-ink-soft)] data-[state=active]:bg-[var(--candle-flame)]/15 data-[state=active]:text-[var(--candle-ink)]"
                >
                  Shop
                </TabsTrigger>
              </TabsList>

              <TabsContent value="talk" className="mt-3 space-y-3 outline-none">
                <div
                  className="rounded-md border border-[var(--candle-rule)] bg-black/25 px-3 py-2 font-serif text-sm leading-snug text-[var(--candle-ink-soft)]"
                  role="region"
                  aria-label="Merchant dialogue"
                >
                  {talkLine ? (
                    talkLine
                  ) : (
                    <p>
                      The wagons creak. The Merchant’s smile is practised and warm. “Coins, pelts,
                      secrets—you’ll find I’m reasonable.”
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleStipend}
                    className="choice-line text-left text-[0.95rem]"
                  >
                    I need gold.
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="shop" className="mt-3 space-y-3 outline-none">
                <p className="font-serif text-sm text-[var(--candle-ink-faint)]">
                  Wolf pelts — buy or sell at <span className="text-[var(--candle-ink)]">{priceLabel}</span>{' '}
                  each.
                </p>
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--candle-rule)] bg-black/25 px-3 py-2">
                  <span className="font-serif text-sm text-[var(--candle-ink-soft)]">
                    Wolf pelts in pack:{' '}
                    <span className="font-mono text-[var(--candle-ink)]">{wolfPelts}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canBuy}
                    className="border-[var(--candle-rule)] font-serif text-[var(--candle-ink)]"
                    onClick={handleBuy}
                  >
                    Buy 1 pelt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canSell}
                    className="border-[var(--candle-rule)] font-serif text-[var(--candle-ink)]"
                    onClick={handleSell}
                  >
                    Sell 1 pelt
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
