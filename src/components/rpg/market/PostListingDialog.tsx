import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { formatCoinShort, getCopperFromModifiers, splitCopperIntoCoins } from '../helpers';
import { listInventoryOptions, type PostListingInput } from './listingEscrow';
import type { QuestState } from '../quests/types';

type PostListingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: QuestState;
  isPending: boolean;
  onSubmit: (payload: { goods: PostListingInput; priceCopper: number }) => void;
};

export function PostListingDialog({
  open,
  onOpenChange,
  questState,
  isPending,
  onSubmit,
}: PostListingDialogProps) {
  const [itemSelection, setItemSelection] = useState('');
  const [priceCopper, setPriceCopper] = useState('12');

  const itemChoices = useMemo(() => listInventoryOptions(questState), [questState]);
  const walletCopper = getCopperFromModifiers(questState.modifiers ?? {});

  const reset = () => {
    setItemSelection('');
    setPriceCopper('12');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const buildGoods = (): PostListingInput | null => {
    if (!itemSelection) return null;
    const opt = itemChoices.find((o) => {
      if (o.kind === 'questItem') return o.label === itemSelection;
      if (o.kind === 'modifierItem') return o.key === itemSelection;
      return false;
    });
    if (!opt) return null;
    if (opt.kind === 'questItem') return { questItemLabel: opt.label };
    return { modifierItemKey: opt.key, modifierItemQty: 1 };
  };

  const buildPrice = (): number | null => {
    const c = Number.parseInt(priceCopper, 10);
    if (!Number.isFinite(c) || c <= 0) return null;
    return c;
  };

  const canSubmit = buildGoods() !== null && buildPrice() !== null && itemChoices.length > 0;
  const pricePreview = buildPrice();

  return (
    <GamePanelDialog
      open={open}
      onOpenChange={handleOpenChange}
      ariaLabel="List item for sale"
      panelClassName="h-auto max-h-[90dvh] w-full max-w-md gap-3 overflow-y-auto p-4 pt-8"
    >
      <GamePanelDialogTitle className="text-lg">List item for sale</GamePanelDialogTitle>
      <div className="space-y-3 py-1">
        <p className="font-serif text-xs text-[var(--candle-ink-faint)]">
          Wallet: {formatCoinShort(splitCopperIntoCoins(walletCopper))}
        </p>
        <div className="space-y-1">
          <Label htmlFor="ml-item" className="font-serif text-xs">
            Item (escrowed when listed)
          </Label>
          <select
            id="ml-item"
            className="w-full rounded border border-[var(--candle-rule)] bg-black/30 px-2 py-1.5 font-serif text-sm text-[var(--candle-ink)]"
            value={itemSelection}
            onChange={(e) => setItemSelection(e.target.value)}
            disabled={itemChoices.length === 0}
          >
            <option value="">Select item…</option>
            {itemChoices.map((o) => {
              if (o.kind === 'questItem') {
                return (
                  <option key={`q-${o.label}`} value={o.label}>
                    {o.label}
                  </option>
                );
              }
              return (
                <option key={o.key} value={o.key}>
                  {o.label} ×{o.quantity}
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ml-price" className="font-serif text-xs">
            Price (copper)
          </Label>
          <Input
            id="ml-price"
            type="number"
            min={1}
            value={priceCopper}
            onChange={(e) => setPriceCopper(e.target.value)}
            className="border-[var(--candle-rule)] bg-black/30 font-serif"
          />
          {pricePreview ? (
            <p className="font-serif text-[0.6rem] text-[var(--candle-ink-faint)]">
              ≈ {formatCoinShort(splitCopperIntoCoins(pricePreview))}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="font-serif" onClick={() => handleOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          className="font-serif"
          disabled={!canSubmit || isPending}
          onClick={() => {
            const goods = buildGoods();
            const copper = buildPrice();
            if (!goods || copper === null) return;
            onSubmit({ goods, priceCopper: copper });
            reset();
          }}
        >
          {isPending ? 'Listing…' : 'List for sale'}
        </Button>
      </div>
    </GamePanelDialog>
  );
}
