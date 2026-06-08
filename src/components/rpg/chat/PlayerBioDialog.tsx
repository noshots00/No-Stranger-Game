import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getCharacterLevel } from '@/components/rpg/quests/engine';
import type { QuestState } from '@/components/rpg/quests/types';
import {
  formatCoinShort,
  formatOrganicSlugForDisplay,
  getCharacterClass,
  getCopperFromModifiers,
  splitCopperIntoCoins,
} from '@/components/rpg/helpers';
import { getRaceDefinition } from '@/components/rpg/races';
import { ItemNameList } from '@/components/rpg/items/ItemName';
import { useOptionalKind0Metadata } from '@/hooks/useOptionalKind0Metadata';

type PlayerBioDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pubkeyHex: string | null;
  /** Name shown in chat (from checkpoint / lobby map / generated). */
  displayName: string;
  questState: QuestState | undefined;
};

function inGameSummary(state: QuestState): string {
  const level = getCharacterLevel(state);
  const characterClass = getCharacterClass(state.modifiers);
  const race = getRaceDefinition(state.assignedRaceSlug);
  const raceLabel =
    race?.displayName ??
    (state.assignedRaceSlug ? formatOrganicSlugForDisplay(state.assignedRaceSlug) : 'Unknown');
  const raceEmoji = race?.symbolEmoji ?? '';
  const prefix = raceEmoji ? `${raceEmoji} ` : '';
  return `${prefix}Level ${level} ${raceLabel} ${characterClass}`.trim();
}

export function PlayerBioDialog({
  open,
  onOpenChange,
  pubkeyHex,
  displayName,
  questState,
}: PlayerBioDialogProps) {
  const kind0 = useOptionalKind0Metadata(pubkeyHex, open);

  const coinLine =
    questState != null
      ? formatCoinShort(splitCopperIntoCoins(getCopperFromModifiers(questState.modifiers)))
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="whisper-tooltip-surface max-h-[85vh] max-w-md overflow-y-auto border-[var(--candle-rule)] bg-black/90 p-5 font-serif text-[var(--candle-ink)] shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-xl tracking-[0.03em] text-[var(--candle-ink)]">
            {displayName}
          </DialogTitle>
          {questState ? (
            <DialogDescription asChild>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--candle-ink-soft)]">
                {inGameSummary(questState)}
              </p>
            </DialogDescription>
          ) : (
            <DialogDescription className="text-sm text-[var(--candle-ink-faint)]">
              No published game save found for this player on these relays yet.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-[var(--candle-ink-soft)]">
          {questState && questState.questItems.length > 0 ? (
            <div>
              <p className="mb-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                Quest items
              </p>
              <ItemNameList
                items={questState.questItems.map((label) => ({ label, category: 'quest' as const }))}
              />
            </div>
          ) : null}

          {questState && coinLine ? (
            <div>
              <p className="mb-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">Coin</p>
              <p className="font-mono text-[var(--candle-ink)]">{coinLine}</p>
            </div>
          ) : null}

          <div>
            <p className="mb-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
              Nostr profile
            </p>
            {kind0.isPending ? (
              <p className="text-[var(--candle-ink-faint)]">Loading profile…</p>
            ) : kind0.isError ? (
              <p className="text-[var(--candle-ink-faint)]">Could not load profile.</p>
            ) : kind0.data?.about ? (
              <p className="whitespace-pre-wrap text-[var(--candle-ink-soft)]">{kind0.data.about}</p>
            ) : (
              <p className="text-[var(--candle-ink-faint)]">No profile bio on relays.</p>
            )}
            {kind0.data?.profileName && kind0.data.profileName !== displayName ? (
              <p className="mt-2 text-xs text-[var(--candle-ink-faint)]">
                Profile name: <span className="text-[var(--candle-ink-soft)]">{kind0.data.profileName}</span>
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
