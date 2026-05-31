import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { listRewardOptions, type PostRewardInput } from './questEscrow';
import type { QuestState } from '../quests/types';

type PostQuestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: QuestState;
  isPending: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    bounty: string;
    rewards: PostRewardInput;
  }) => void;
};

export function PostQuestDialog({
  open,
  onOpenChange,
  questState,
  isPending,
  onSubmit,
}: PostQuestDialogProps) {
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

  const reset = () => {
    setTitle('');
    setDescription('');
    setBounty('');
    setUseGold(false);
    setGoldAmount('1');
    setUseItem(false);
    setItemSelection('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

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
    <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent
        className="z-[70] max-h-[90dvh] overflow-y-auto border border-[var(--candle-rule)] bg-[var(--candle-hearth)] text-[var(--candle-ink)] sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-cormorant text-lg text-[var(--candle-wax)]">Post New Quest</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor="pq-title" className="font-serif text-xs">
              Title
            </Label>
            <Input
              id="pq-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-[var(--candle-rule)] bg-black/30 font-serif"
              maxLength={80}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pq-desc" className="font-serif text-xs">
              Description
            </Label>
            <Textarea
              id="pq-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[72px] border-[var(--candle-rule)] bg-black/30 font-serif"
              maxLength={500}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pq-bounty" className="font-serif text-xs">
              Bounty object (free text)
            </Label>
            <Input
              id="pq-bounty"
              value={bounty}
              onChange={(e) => setBounty(e.target.value)}
              placeholder="wolf hide, brass ring, …"
              className="border-[var(--candle-rule)] bg-black/30 font-serif"
              maxLength={64}
            />
          </div>
          <div className="space-y-2 rounded-md border border-[var(--candle-rule)]/70 bg-black/20 p-2">
            <p className="font-serif text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-faint)]">
              Reward (escrowed now)
            </p>
            <label className="flex items-center gap-2 font-serif text-sm">
              <input type="checkbox" checked={useGold} onChange={(e) => setUseGold(e.target.checked)} />
              Gold
            </label>
            {useGold ? (
              <Input
                type="number"
                min={1}
                value={goldAmount}
                onChange={(e) => setGoldAmount(e.target.value)}
                className="border-[var(--candle-rule)] bg-black/30 font-serif"
              />
            ) : null}
            <label className="flex items-center gap-2 font-serif text-sm">
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
                className="w-full rounded border border-[var(--candle-rule)] bg-black/30 px-2 py-1.5 font-serif text-sm text-[var(--candle-ink)]"
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
            <p className="font-serif text-[0.6rem] text-[var(--candle-ink-faint)]">
              Choose gold, an item, or both. Reward leaves your inventory when you post.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="font-serif" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="font-serif"
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
              reset();
            }}
          >
            {isPending ? 'Posting…' : 'Post quest'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
