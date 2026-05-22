import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { canCraft, craftModifierDelta, listCrafterMaterials } from './craftingEngine';
import { CRAFT_RECIPES } from './craftingConfig';
import type { QuestState } from '../quests/types';
import type { ModifierMap } from '../quests/types';

type CraftersCornerPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: QuestState;
  onApplyModifiers: (delta: ModifierMap) => void;
};

export function CraftersCornerPanel({
  open,
  onOpenChange,
  questState,
  onApplyModifiers,
}: CraftersCornerPanelProps) {
  const { toast } = useToast();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const materials = listCrafterMaterials(questState);

  const handleCraft = (recipeId: string) => {
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    if (!canCraft(questState, recipe)) {
      toast({
        title: 'Cannot craft',
        description: `Need ${recipe.inputQty} ${materials.find((m) => m.itemKey === recipe.inputKey)?.label ?? 'material'}.`,
      });
      return;
    }
    onApplyModifiers(craftModifierDelta(recipe));
    toast({ title: 'Crafted', description: `You made ${recipe.outputLabel}.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex !flex-col gap-0 overflow-hidden border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
          'h-[95dvh] max-h-[95dvh] min-h-0 w-[min(95vw,430px)] max-w-none sm:rounded-lg'
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1 px-4 text-center sm:text-center">
          <DialogTitle className="font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
            Crafter&apos;s Corner
          </DialogTitle>
          <p className="font-serif text-xs text-[var(--candle-ink-faint)]">
            Raw and crafting materials in your pack
          </p>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
          {materials.length === 0 ? (
            <p className="px-3 py-8 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
              No materials yet. Buy raw ore at the Market, then return here to craft.
            </p>
          ) : (
            <ul className="list-none px-2 py-2">
              {materials.map((row) => {
                const expanded = expandedKey === row.itemKey;
                return (
                  <li
                    key={row.itemKey}
                    className="border-b border-[var(--candle-rule)]/40 py-2 last:border-b-0"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 text-left font-serif text-sm text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]"
                      onClick={() => setExpandedKey(expanded ? null : row.itemKey)}
                    >
                      <span>
                        <span className="text-[var(--candle-wax)]">{row.label}</span>
                        <span className="text-[var(--candle-ink-faint)]"> ×{row.quantity}</span>
                      </span>
                      {row.recipes.length > 0 ? (
                        <span className="text-[0.6rem] uppercase tracking-[0.1em] text-[var(--candle-ink-faint)]">
                          {expanded ? '▲' : '▼'}
                        </span>
                      ) : null}
                    </button>
                    {expanded && row.recipes.length > 0 ? (
                      <div className="mt-2 pl-1">
                        <label
                          htmlFor={`craft-${row.itemKey}`}
                          className="mb-1 block font-serif text-[0.65rem] text-[var(--candle-ink-faint)]"
                        >
                          Craft into
                        </label>
                        <select
                          id={`craft-${row.itemKey}`}
                          className="w-full rounded border border-[var(--candle-rule)] bg-black/35 px-2 py-1.5 font-serif text-sm text-[var(--candle-ink)]"
                          defaultValue=""
                          onChange={(e) => {
                            const recipeId = e.target.value;
                            if (!recipeId) return;
                            handleCraft(recipeId);
                            e.target.value = '';
                          }}
                        >
                          <option value="">Choose…</option>
                          {row.recipes.map((recipe) => (
                            <option key={recipe.id} value={recipe.id}>
                              {recipe.outputLabel}
                              {recipe.inputQty > 1 ? ` (${recipe.inputQty}× ${row.label})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {expanded && row.recipes.length === 0 ? (
                      <p className="mt-1 font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
                        No recipes for this material yet.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
