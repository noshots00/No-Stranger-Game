import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { cn } from '@/lib/utils';
import { GamePanelDialog, GamePanelDialogTitle } from '@/components/rpg/GamePanelDialog';
import { canPersistQuestCheckpoint } from '@/components/rpg/quests/questSaveGuard';
import {
  fetchAllQuestStateCheckpoints,
  formatQuestCheckpointSavedAt,
  questCheckpointDisplayDay,
  type QuestCheckpointRecord,
} from '@/components/rpg/gameProfile';

type QuestCheckpointRestoreDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myPubkey: string | undefined;
  restoringEventId: string | null;
  onRestore: (record: QuestCheckpointRecord) => void | Promise<void>;
};

export function QuestCheckpointRestoreDialog({
  open,
  onOpenChange,
  myPubkey,
  restoringEventId,
  onRestore,
}: QuestCheckpointRestoreDialogProps) {
  const { nostr } = useNostr();

  const checkpointsQuery = useQuery({
    queryKey: ['dev-quest-checkpoints', myPubkey],
    queryFn: () => fetchAllQuestStateCheckpoints(nostr, myPubkey!),
    enabled: open && Boolean(myPubkey),
    staleTime: 0,
  });

  const rows = checkpointsQuery.data ?? [];

  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Restore checkpoint"
      panelClassName="!h-auto max-h-[min(88vh,640px)] w-full max-w-md gap-3 border-[var(--candle-rule)] bg-[var(--candle-panel)] p-4 pt-8 font-serif text-[var(--candle-wax)]"
    >
      <GamePanelDialogTitle className="text-left font-serif text-lg">
        Restore checkpoint
      </GamePanelDialogTitle>

      {!myPubkey ? (
        <p className="text-sm text-[var(--candle-ink-faint)]">Log in to list relay checkpoints.</p>
      ) : checkpointsQuery.isPending ? (
        <p className="text-sm text-[var(--candle-ink-faint)]">Loading checkpoints from relays…</p>
      ) : checkpointsQuery.isError ? (
        <p className="text-sm text-red-300/90">
          {checkpointsQuery.error instanceof Error
            ? checkpointsQuery.error.message
            : 'Could not load checkpoints.'}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--candle-ink-faint)]">No kind 10032 checkpoints found.</p>
      ) : (
        <div className="max-h-[min(52vh,420px)] overflow-y-auto rounded-md border border-[var(--candle-rule)]/60">
          <ul className="list-none divide-y divide-[var(--candle-rule)]/40 p-0">
            {rows.map((row, index) => {
              const name = row.state.playerName.trim() || '(unnamed)';
              const day = questCheckpointDisplayDay(row.state);
              const canPublish = canPersistQuestCheckpoint(row.state);
              const isRestoring = restoringEventId === row.eventId;

              return (
                <li key={row.eventId} className="flex items-start gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium text-[var(--candle-wax)]">
                      {name}
                      <span className="font-normal text-[var(--candle-ink-soft)]"> · Day {day}</span>
                      {index === 0 ? (
                        <span className="ml-1 text-[0.65rem] uppercase tracking-wide text-[var(--candle-flame-soft)]">
                          (current)
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[0.7rem] text-[var(--candle-ink-faint)]">
                      {formatQuestCheckpointSavedAt(row.savedAtMs)}
                    </p>
                    {!canPublish ? (
                      <p className="text-[0.65rem] text-amber-200/80">
                        Unnamed — restores locally only; will not publish to relay.
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={cn(
                      'rpg-mini-btn shrink-0 px-2 py-1 font-serif text-[0.65rem] uppercase tracking-wide'
                    )}
                    disabled={Boolean(restoringEventId)}
                    onClick={() => void onRestore(row)}
                  >
                    {isRestoring ? 'Loading…' : 'Load'}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

    </GamePanelDialog>
  );
}
