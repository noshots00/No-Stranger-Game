import { Button } from '@/components/ui/button';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelScroll } from '../GamePanelScroll';
import { JOB_REGISTRY } from './registry';
import type { QuestState } from '../quests/types';

type JobsHallPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: QuestState;
  onSwitchJob: (jobSlug: string) => void;
};

export function JobsHallPanel({
  open,
  onOpenChange,
  questState,
  onSwitchJob,
}: JobsHallPanelProps) {
  const unlocked = new Set(questState.unlockedJobSlugs ?? []);
  const activeSlug = questState.activeJobSlug;
  const activeJob = activeSlug ? JOB_REGISTRY[activeSlug] : undefined;

  const resourceEntries = Object.entries(questState.resources ?? {}).filter(([, n]) => n > 0);

  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Jobs Hall"
      panelClassName="h-auto max-h-[min(90vh,640px)]"
    >
      <GamePanelDialogTitle>Jobs Hall</GamePanelDialogTitle>
      <GamePanelScroll className="min-h-0 flex-1 pr-3">
          <div className="space-y-4 text-sm">
            <p className="text-[var(--candle-ink-soft)]">
              Your profession stays active until you switch. Choose once, and it remains selected.
            </p>

            {activeJob ? (
              <div className="rounded-md border border-[var(--candle-flame-soft)]/30 bg-black/20 px-3 py-2">
                <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-faint)]">Active</p>
                <p className="font-semibold text-[var(--candle-wax)]">{activeJob.displayName}</p>
                <p className="mt-1 text-xs text-[var(--candle-ink-soft)]">{activeJob.description}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-faint)]">
                Professions
              </p>
              {Object.values(JOB_REGISTRY).map((job) => {
                const isUnlocked = unlocked.has(job.slug);
                const isActive = activeSlug === job.slug;
                return (
                  <div
                    key={job.slug}
                    className="rounded-md border border-[var(--candle-rule)]/80 bg-black/25 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[var(--candle-ink)]">{job.displayName}</p>
                        <p className="text-[0.65rem] text-[var(--candle-ink-faint)]">{job.hallLabel}</p>
                      </div>
                      {isActive ? (
                        <span className="text-[0.6rem] uppercase tracking-wider text-[var(--candle-flame-soft)]">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[var(--candle-ink-soft)]">{job.description}</p>
                    {isUnlocked && !isActive ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full font-serif text-xs"
                        onClick={() => onSwitchJob(job.slug)}
                      >
                        Switch to {job.displayName}
                      </Button>
                    ) : null}
                    {!isUnlocked ? (
                      <p className="mt-2 text-[0.65rem] italic text-[var(--candle-ink-faint)]">
                        Explore the forest as an Explorer to unlock.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {resourceEntries.length > 0 ? (
              <div className="space-y-1 border-t border-[var(--candle-rule)] pt-3">
                <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-faint)]">
                  Stockpile
                </p>
                <ul className="text-xs text-[var(--candle-ink-soft)]">
                  {resourceEntries.map(([key, amount]) => (
                    <li key={key}>
                      {key}: {amount}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
      </GamePanelScroll>
    </GamePanelDialog>
  );
}
