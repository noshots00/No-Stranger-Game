import { useMemo, useState } from 'react';
import type { MVPCharacter } from '@/lib/rpg/utils';
import { ITEMS } from '@/lib/rpg/items';
import { postingFee, validateEscrowMath } from '@/lib/rpg/playerQuests';
import type { PostQuestInput } from '@/hooks/usePlayerQuestBoard';

interface PostQuestModalProps {
  character: MVPCharacter;
  onClose: () => void;
  onSubmit: (input: PostQuestInput) => Promise<void>;
}

export function PostQuestModal({ character, onClose, onSubmit }: PostQuestModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedItem, setRequestedItem] = useState('wolf-hide');
  const [bountyPerUnit, setBountyPerUnit] = useState(1);
  const [totalEscrow, setTotalEscrow] = useState(10);
  const [postAsAlias, setPostAsAlias] = useState(false);
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableGold = (character.gold ?? 0) - (character.escrowedGold ?? 0);
  const canAfford = availableGold >= (postingFee + totalEscrow);
  const escrowIsValid = validateEscrowMath(totalEscrow, bountyPerUnit);
  const maxUnits = useMemo(() => {
    if (bountyPerUnit <= 0) return 0;
    return Math.floor(totalEscrow / bountyPerUnit);
  }, [bountyPerUnit, totalEscrow]);
  const isValid = title.trim().length > 0 && description.trim().length > 0 && canAfford && escrowIsValid;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        requestedItem,
        bountyPerUnit,
        totalEscrow,
        alias: postAsAlias ? alias.trim() || undefined : undefined,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to post quest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 px-4 py-8 overflow-y-auto">
      <div className="mx-auto max-w-xl rounded-xl border p-5 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--ink-ghost)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-cormorant text-2xl" style={{ color: 'var(--ink)' }}>Post a Quest</h3>
          <button type="button" className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }} onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-transparent border"
              style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
              maxLength={90}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>Quest Text</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-transparent border min-h-24"
              style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
              maxLength={500}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>Item</span>
              <select
                value={requestedItem}
                onChange={(e) => setRequestedItem(e.target.value)}
                className="w-full rounded-md px-2 py-2 bg-transparent border"
                style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
              >
                {Object.values(ITEMS).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>Bounty/Unit</span>
              <input
                type="number"
                min={1}
                value={bountyPerUnit}
                onChange={(e) => setBountyPerUnit(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-md px-3 py-2 bg-transparent border"
                style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--ink-ghost)' }}>Total Escrow</span>
              <input
                type="number"
                min={1}
                value={totalEscrow}
                onChange={(e) => setTotalEscrow(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-md px-3 py-2 bg-transparent border"
                style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-dim)' }}>
            <input type="checkbox" checked={postAsAlias} onChange={(e) => setPostAsAlias(e.target.checked)} />
            Post with a mysterious name
          </label>

          {postAsAlias ? (
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Mysterious alias"
              className="w-full rounded-md px-3 py-2 bg-transparent border"
              style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink)' }}
              maxLength={40}
            />
          ) : null}

          <div className="rounded-md p-3 text-sm" style={{ background: 'var(--surface-dim)', color: 'var(--ink-dim)' }}>
            Cost now: {postingFee} fee + {totalEscrow} escrow. Max units: {maxUnits}. Available gold: {availableGold}.
          </div>

          {!escrowIsValid ? (
            <p className="text-sm" style={{ color: 'var(--crimson)' }}>
              Escrow must be evenly divisible by bounty per unit.
            </p>
          ) : null}
          {!canAfford ? (
            <p className="text-sm" style={{ color: 'var(--crimson)' }}>
              You do not have enough gold to cover fee + escrow.
            </p>
          ) : null}
          {error ? <p className="text-sm" style={{ color: 'var(--crimson)' }}>{error}</p> : null}

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full rounded-md py-2 font-cormorant text-lg disabled:opacity-50"
            style={{ background: 'var(--ember)', color: 'var(--void)' }}
          >
            {isSubmitting ? 'Signing quest...' : 'Post Quest'}
          </button>
        </form>
      </div>
    </div>
  );
}
