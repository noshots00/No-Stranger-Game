import { useState } from 'react';
import { cn } from '@/lib/utils';
import { VillageLocationScreen } from '../village/VillageLocationScreen';
import { RPG_UI_CAPTION, RPG_UI_UI } from '../typography/rpgUiTypography';
import { useToast } from '@/hooks/useToast';
import { canCraft, craftModifierDelta, listCrafterMaterials } from './craftingEngine';
import { CRAFT_RECIPES } from './craftingConfig';
import type { QuestState } from '../quests/types';
import type { ModifierMap } from '../quests/types';

type CraftersCornerScreenProps = {
  className?: string;
  onClose: () => void;
  questState: QuestState;
  onApplyModifiers: (delta: ModifierMap) => void;
};

export function CraftersCornerScreen({
  className,
  onClose,
  questState,
  onApplyModifiers,
}: CraftersCornerScreenProps) {
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
    <VillageLocationScreen panel="craftersCorner" className={className} onClose={onClose}>
      <p className={cn(RPG_UI_CAPTION, 'text-center')}>Raw and crafting materials in your pack</p>

      <div className="rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
        {materials.length === 0 ? (
          <p className={cn(RPG_UI_CAPTION, 'px-2 py-4 text-center')}>
            No materials yet. Buy raw ore at the Market, then return here to craft.
          </p>
        ) : (
          <ul className="list-none px-2 py-1">
            {materials.map((row) => {
              const expanded = expandedKey === row.itemKey;
              return (
                <li
                  key={row.itemKey}
                  className="border-b border-[var(--candle-rule)]/40 py-1 last:border-b-0"
                >
                  <button
                    type="button"
                    className={cn(
                      RPG_UI_UI,
                      'flex w-full items-center justify-between gap-2 text-left hover:text-[var(--candle-wax)]'
                    )}
                    onClick={() => setExpandedKey(expanded ? null : row.itemKey)}
                  >
                    <span>
                      <span className="text-[var(--candle-wax)]">{row.label}</span>
                      <span className="text-[var(--candle-ink-faint)]"> ×{row.quantity}</span>
                    </span>
                    {row.recipes.length > 0 ? (
                      <span className={cn(RPG_UI_CAPTION, 'uppercase tracking-[0.1em]')}>
                        {expanded ? '▲' : '▼'}
                      </span>
                    ) : null}
                  </button>
                  {expanded && row.recipes.length > 0 ? (
                    <div className="mt-1 pl-1">
                      <label
                        htmlFor={`craft-${row.itemKey}`}
                        className={cn(RPG_UI_CAPTION, 'mb-0.5 block')}
                      >
                        Craft into
                      </label>
                      <select
                        id={`craft-${row.itemKey}`}
                        className={cn(
                          RPG_UI_UI,
                          'w-full rounded border border-[var(--candle-rule)] bg-black/35 px-2 py-1'
                        )}
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
                    <p className={cn(RPG_UI_CAPTION, 'mt-0.5')}>No recipes for this material yet.</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </VillageLocationScreen>
  );
}
