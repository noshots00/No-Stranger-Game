import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ModifierMap } from '@/components/rpg/quests/types';
import { formatCoinShort, splitCopperIntoCoins } from '@/components/rpg/helpers';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/utils';
import {
  MERCHANT_GOLD_STIPEND_DELTA,
  MERCHANT_TRADE_GOODS,
  buyTradeGoodDelta,
  sellTradeGoodDelta,
  type MerchantTradeGood,
} from '@/components/rpg/merchant/merchantEconomy';
import {
  EXIT_TO_MAIN_LABEL,
  EXIT_TO_MAIN_MERCHANT,
  MERCHANT_TOPICS,
  STIPEND_MERCHANT_LINE,
  STIPEND_PLAYER_LINE,
  appendPair,
  seedOpeningTranscript,
  type DialogueChoice,
  type TopicId,
  type TranscriptEntry,
} from '@/components/rpg/merchant/merchantDialogueTree';

const MERCHANT_PORTRAIT_SRC = publicAsset(
  'art/converted/batch-2026-05-02_21-10-35/the-ogre-king.webp'
);

type MerchantPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletCopper: number;
  itemCounts: Readonly<Record<string, number>>;
  onApplyModifiers: (delta: ModifierMap) => void;
};

function priceLabelFor(good: MerchantTradeGood): string {
  return formatCoinShort(splitCopperIntoCoins(good.priceCopper));
}

function tradeBuyTranscript(good: MerchantTradeGood): TranscriptEntry[] {
  return appendPair(
    `You buy one ${good.label.toLowerCase()}.`,
    'The Merchant slides the goods across. “Pleasure doing business.”'
  );
}

function tradeSellTranscript(good: MerchantTradeGood): TranscriptEntry[] {
  return appendPair(
    `You sell one ${good.label.toLowerCase()}.`,
    'Coins clink; the item vanishes into the wagon. “Counted.”'
  );
}

export function MerchantPanel({
  open,
  onOpenChange,
  walletCopper,
  itemCounts,
  onApplyModifiers,
}: MerchantPanelProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [activeTopic, setActiveTopic] = useState<TopicId>('main');
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setTranscript([]);
      setActiveTopic('main');
      return;
    }
    setTranscript(seedOpeningTranscript());
    setActiveTopic('main');
  }, [open]);

  useLayoutEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [transcript]);

  const handleChoice = (choice: DialogueChoice) => {
    if (choice.type === 'reply') {
      setTranscript((prev) => [...prev, ...appendPair(choice.label, choice.merchantText)]);
      return;
    }
    setTranscript((prev) => [...prev, ...appendPair(choice.label, choice.merchantBridge)]);
    setActiveTopic(choice.topicId);
  };

  const handleExitToMain = () => {
    setTranscript((prev) => [...prev, ...appendPair(EXIT_TO_MAIN_LABEL, EXIT_TO_MAIN_MERCHANT)]);
    setActiveTopic('main');
  };

  const handleStipend = () => {
    onApplyModifiers(MERCHANT_GOLD_STIPEND_DELTA);
    setTranscript((prev) => [...prev, ...appendPair(STIPEND_PLAYER_LINE, STIPEND_MERCHANT_LINE)]);
  };

  const handleBuy = (good: MerchantTradeGood) => {
    if (walletCopper < good.priceCopper) return;
    onApplyModifiers(buyTradeGoodDelta(good));
    setTranscript((prev) => [...prev, ...tradeBuyTranscript(good)]);
  };

  const handleSell = (good: MerchantTradeGood) => {
    const n = itemCounts[good.itemKey] ?? 0;
    if (n < 1) return;
    onApplyModifiers(sellTradeGoodDelta(good));
    setTranscript((prev) => [...prev, ...tradeSellTranscript(good)]);
  };

  const topicChoices = MERCHANT_TOPICS[activeTopic].choices;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex !flex-col gap-0 overflow-hidden border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
          // Fixed shell: same box for Talk/Shop; inner regions scroll (min-h-0 on flex children).
          'h-[95dvh] max-h-[95dvh] min-h-0 w-[min(95vw,430px)] max-w-none sm:rounded-lg',
          'data-[state=open]:slide-in-from-bottom-2'
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1 px-10 text-center sm:text-center">
          <DialogTitle className="font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
            Merchant
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <Tabs defaultValue="talk" className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex w-full shrink-0 flex-row items-center justify-center gap-6 px-1">
              <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
                <img
                  src={MERCHANT_PORTRAIT_SRC}
                  alt="The Merchant"
                  className="aspect-[3/4] w-[min(120px,32vw)] rounded-md border border-[var(--candle-rule)] object-cover shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
                <TabsList className="flex h-auto w-full max-w-[11rem] flex-col gap-1.5 rounded-md border border-[var(--candle-rule)] bg-black/30 p-1.5">
                  <TabsTrigger
                    value="talk"
                    className="w-full justify-center font-serif text-xs uppercase tracking-[0.14em] text-[var(--candle-ink-soft)] data-[state=active]:bg-[var(--candle-flame)]/15 data-[state=active]:text-[var(--candle-ink)]"
                  >
                    Talk
                  </TabsTrigger>
                  <TabsTrigger
                    value="shop"
                    className="w-full justify-center font-serif text-xs uppercase tracking-[0.14em] text-[var(--candle-ink-soft)] data-[state=active]:bg-[var(--candle-flame)]/15 data-[state=active]:text-[var(--candle-ink)]"
                  >
                    Shop
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

              <TabsContent
                value="talk"
                className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden outline-none data-[state=inactive]:hidden"
              >
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                  <ScrollArea className="min-h-0 min-w-0 flex-[1.35] rounded-md border border-[var(--candle-rule)] bg-black/25 px-1">
                  <div
                    className="space-y-3 px-3 py-2 pr-4 font-serif text-sm leading-snug"
                    role="log"
                    aria-label="Conversation with the merchant"
                  >
                    {transcript.map((entry) => (
                      <p
                        key={entry.id}
                        className={
                          entry.role === 'narrator'
                            ? 'italic text-[var(--candle-ink-faint)]'
                            : entry.role === 'player'
                              ? 'text-[var(--candle-wax)]'
                              : 'text-[var(--candle-ink-soft)]'
                        }
                      >
                        {entry.role === 'player' ? (
                          <>
                            <span className="font-semibold text-[var(--candle-ink)]">You: </span>
                            {entry.text}
                          </>
                        ) : entry.role === 'merchant' ? (
                          <>
                            <span className="font-semibold text-[var(--candle-flame-soft)]">
                              Merchant:{' '}
                            </span>
                            {entry.text}
                          </>
                        ) : (
                          entry.text
                        )}
                      </p>
                    ))}
                    <div ref={logEndRef} className="h-px" aria-hidden />
                  </div>
                </ScrollArea>

                <ScrollArea className="min-h-0 min-w-0 flex-1 rounded-md border border-[var(--candle-rule)] bg-black/20 px-1">
                  <div className="flex flex-col gap-0.5 py-1 pr-4">
                    {topicChoices.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleChoice(c)}
                        className="choice-line text-left text-[0.9rem]"
                      >
                        {c.label}
                      </button>
                    ))}
                    {activeTopic !== 'main' ? (
                      <button
                        type="button"
                        onClick={handleExitToMain}
                        className="choice-line border-t border-[var(--candle-rule)]/60 pt-2 text-left text-[0.88rem] text-[var(--candle-ink-faint)]"
                      >
                        {EXIT_TO_MAIN_LABEL}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleStipend}
                      className="choice-line text-left text-[0.95rem] font-medium text-[var(--candle-wax)]"
                    >
                      {STIPEND_PLAYER_LINE}
                    </button>
                  </div>
                </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent
                value="shop"
                className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
              >
                <ScrollArea className="min-h-0 min-w-0 flex-1 rounded-md border border-[var(--candle-rule)] bg-black/20 px-1">
                  <div className="space-y-1 py-2 pr-4">
                    <p className="px-3 pb-2 font-serif text-sm text-[var(--candle-ink-faint)]">
                      Buy or sell at the listed price (same both ways). Unlimited stock for now.
                    </p>
                    {MERCHANT_TRADE_GOODS.map((good) => {
                      const owned = itemCounts[good.itemKey] ?? 0;
                      const canBuy = walletCopper >= good.priceCopper;
                      const canSell = owned >= 1;
                      return (
                        <div
                          key={good.itemKey}
                          className="border-b border-[var(--candle-rule)]/80 px-3 py-3 last:border-b-0"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-cormorant text-base font-semibold text-[var(--candle-ink)]">
                              {good.label}
                            </span>
                            <span className="font-mono text-xs text-[var(--candle-ink-soft)]">
                              {priceLabelFor(good)} each
                            </span>
                          </div>
                          <p className="mt-1 font-serif text-xs text-[var(--candle-ink-faint)]">
                            In pack:{' '}
                            <span className="font-mono text-[var(--candle-ink)]">{owned}</span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!canBuy}
                              className="border-[var(--candle-rule)] font-serif text-[var(--candle-ink)]"
                              onClick={() => handleBuy(good)}
                            >
                              Buy 1
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!canSell}
                              className="border-[var(--candle-rule)] font-serif text-[var(--candle-ink)]"
                              onClick={() => handleSell(good)}
                            >
                              Sell 1
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
