import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { RPG_UI_BODY, RPG_UI_META } from '../typography/rpgUiTypography';
import { listRewardOptions, type PostRewardInput } from './questEscrow';
import type { QuestState } from '../quests/types';

export type PostQuestPayload = {
  title: string;
  description: string;
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bounty, setBounty] = useState('');
  const [useGold, setUseGold] = useState(false);
  const [goldAmount, setGoldAmount] = useState('1');
  const [useItem, setUseItem] = useState(false);
  const [itemSelection, setItemSelection] = useState('');

  const rewardOptions = useMemo(() => listRewardOptions(questState), [questState]);
  const itemChoices = useMemo(
    () => rewardOptions.filter((o) => o.kind !== 'gold'),
    [rewardOptions]
  );

  const buildRewards = (): PostRewardInput | null => {
    const rewards: PostRewardInput = {};
    if (useGold) {
      const g = Number.parseInt(goldAmount, 10);
      if (!Number.isFinite(g) || g <= 0) return null;
      rewards.goldAmount = g;
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
    if (!rewards.goldAmount && !rewards.questItemLabel && !rewards.modifierItemKey) return null;
    return rewards;
  };

  const canSubmit =
    title.trim().length > 0 &&
    bounty.trim().length > 0 &&
    buildRewards() !== null &&
    (!useItem || itemSelection.length > 0);

  return (
    <div className="space-y-2 rounded-md border border-[var(--candle-rule)]/70 bg-black/20 p-2">
      <div className="space-y-1">
        <Label htmlFor="pq-title" className={RPG_UI_META}>
          Title
        </Label>
        <Input
          id="pq-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 border-[var(--candle-rule)] bg-black/30 text-[13px]"
          maxLength={80}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pq-desc" className={RPG_UI_META}>
          Description
        </Label>
        <Textarea
          id="pq-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[60px] border-[var(--candle-rule)] bg-black/30 text-[13px]"
          maxLength={500}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pq-bounty" className={RPG_UI_META}>
          Bounty object
        </Label>
        <Input
          id="pq-bounty"
          value={bounty}
          onChange={(e) => setBounty(e.target.value)}
          placeholder="wolf hide, brass ring, …"
          className="h-8 border-[var(--candle-rule)] bg-black/30 text-[13px]"
          maxLength={64}
        />
      </div>
      <div className="space-y-1.5 rounded-md border border-[var(--candle-rule)]/50 bg-black/15 p-2">
        <p className={cn(RPG_UI_META, 'uppercase tracking-[0.1em]')}>Reward (escrowed now)</p>
        <label className={cn('flex items-center gap-2', RPG_UI_BODY)}>
          <input type="checkbox" checked={useGold} onChange={(e) => setUseGold(e.target.checked)} />
          Gold
        </label>
        {useGold ? (
          <Input
            type="number"
            min={1}
            value={goldAmount}
            onChange={(e) => setGoldAmount(e.target.value)}
            className="h-8 border-[var(--candle-rule)] bg-black/30 text-[13px]"
          />
        ) : null}
        <label className={cn('flex items-center gap-2', RPG_UI_BODY)}>
          <input
            type="checkbox"
            checked={useItem}
            onChange={(e) => setUseItem(e.target.checked)}
            disabled={itemChoices.length === 0}
          />
          Item from inventory
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
              title: title.trim(),
              description: description.trim(),
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
