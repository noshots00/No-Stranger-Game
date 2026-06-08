import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RPG_UI_BODY, RPG_UI_META } from '../typography/rpgUiTypography';
import { listRewardOptions, type PostRewardInput } from './questEscrow';
import type { QuestState } from '../quests/types';

export type PostQuestPayload = {
  bounty: string;
  rewards: PostRewardInput;
};

type PostQuestFormProps = {
  questState: QuestState;
  isPending: boolean;
  errorMessage?: string | null;
  onSubmit: (payload: PostQuestPayload) => void;
  onCancel: () => void;
};

export function PostQuestForm({
  questState,
  isPending,
  errorMessage,
  onSubmit,
  onCancel,
}: PostQuestFormProps) {
  const [bounty, setBounty] = useState('');
  const [goldPerUnit, setGoldPerUnit] = useState('1');
  const [slotCount, setSlotCount] = useState('1');
  const [useItem, setUseItem] = useState(false);
  const [itemSelection, setItemSelection] = useState('');

  const rewardOptions = useMemo(() => listRewardOptions(questState), [questState]);
  const itemChoices = useMemo(
    () => rewardOptions.filter((o) => o.kind !== 'gold'),
    [rewardOptions]
  );

  const parsedGoldPerUnit = Number.parseInt(goldPerUnit, 10);
  const parsedSlotCount = Number.parseInt(slotCount, 10);
  const totalGoldEscrow =
    Number.isFinite(parsedGoldPerUnit) &&
    Number.isFinite(parsedSlotCount) &&
    parsedGoldPerUnit > 0 &&
    parsedSlotCount > 0
      ? parsedGoldPerUnit * parsedSlotCount
      : 0;

  const buildRewards = (): PostRewardInput | null => {
    const rewards: PostRewardInput = {};
    const per = Number.parseInt(goldPerUnit, 10);
    const slots = Number.parseInt(slotCount, 10);
    if (Number.isFinite(per) && per > 0 && Number.isFinite(slots) && slots > 0) {
      rewards.goldPerUnit = per;
      rewards.slotCount = slots;
    }
    if (useItem && itemSelection) {
      const opt = itemChoices.find((o) => {
        if (o.kind === 'questItem') return o.label === itemSelection;
        if (o.kind === 'modifierItem') return o.key === itemSelection;
        return false;
      });
      if (!opt) return null;
      if (opt.kind === 'questItem') rewards.questItemLabel = opt.label;
      if (opt.kind === 'modifierItem') {
        rewards.modifierItemKey = opt.key;
        rewards.modifierItemQty = 1;
      }
    }
    if (!rewards.goldPerUnit && !rewards.questItemLabel && !rewards.modifierItemKey) return null;
    return rewards;
  };

  const canSubmit =
    bounty.trim().length > 0 &&
    buildRewards() !== null &&
    (!useItem || itemSelection.length > 0);

  return (
    <div className="space-y-2 rounded-md border border-[var(--candle-rule)]/70 bg-black/20 p-2">
      <div className="space-y-1">
        <Label htmlFor="pq-bounty" className={RPG_UI_META}>
          Bounty item
        </Label>
        <Input
          id="pq-bounty"
          value={bounty}
          onChange={(e) => setBounty(e.target.value)}
          placeholder="wolf pelts"
          className="h-8 border-[var(--candle-rule)] bg-black/30 text-[13px]"
          maxLength={64}
        />
      </div>
      <div className="space-y-1.5 rounded-md border border-[var(--candle-rule)]/50 bg-black/15 p-2">
        <p className={cn(RPG_UI_META, 'uppercase tracking-[0.1em]')}>Reward (escrowed now)</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="pq-gold-per" className={RPG_UI_META}>
              Gold each
            </Label>
            <Input
              id="pq-gold-per"
              type="number"
              min={1}
              value={goldPerUnit}
              onChange={(e) => setGoldPerUnit(e.target.value)}
              className="h-8 border-[var(--candle-rule)] bg-black/30 text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pq-slots" className={RPG_UI_META}>
              How many
            </Label>
            <Input
              id="pq-slots"
              type="number"
              min={1}
              value={slotCount}
              onChange={(e) => setSlotCount(e.target.value)}
              className="h-8 border-[var(--candle-rule)] bg-black/30 text-[13px]"
            />
          </div>
        </div>
        {totalGoldEscrow > 0 ? (
          <p className={cn(RPG_UI_META, 'text-[var(--candle-wax)]')}>{totalGoldEscrow} gold escrowed</p>
        ) : null}
        <label className={cn('flex items-center gap-2', RPG_UI_BODY)}>
          <input
            type="checkbox"
            checked={useItem}
            onChange={(e) => setUseItem(e.target.checked)}
            disabled={itemChoices.length === 0}
          />
          Also add item reward (per turn-in)
        </label>
        {useItem ? (
          <select
            className="w-full rounded border border-[var(--candle-rule)] bg-black/30 px-2 py-1.5 text-[13px] text-[var(--candle-ink)]"
            value={itemSelection}
            onChange={(e) => setItemSelection(e.target.value)}
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
              if (o.kind === 'modifierItem') {
                return (
                  <option key={o.key} value={o.key}>
                    {o.label} ×{o.quantity}
                  </option>
                );
              }
              return null;
            })}
          </select>
        ) : null}
      </div>
      {errorMessage ? (
        <p className={cn(RPG_UI_META, 'text-red-300/90')}>{errorMessage}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 text-[13px]"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1 text-[13px]"
          disabled={!canSubmit || isPending}
          onClick={() => {
            const rewards = buildRewards();
            if (!rewards) return;
            onSubmit({
              bounty: bounty.trim(),
              rewards,
            });
          }}
        >
          {isPending ? 'Posting…' : 'Post quest'}
        </Button>
      </div>
    </div>
  );
}
