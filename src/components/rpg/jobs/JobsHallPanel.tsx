import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatResourceLabel } from '../helpers';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelScroll } from '../GamePanelScroll';
import { JOB_SLUG_EXPLORER } from '../constants';
import { JOB_REGISTRY } from './registry';
import { RPG_UI_CAPTION, RPG_UI_META, RPG_UI_UI } from '../typography/rpgUiTypography';
import {
  VillageActionChip,
  VillageActionRow,
  VillageActionRowItem,
} from '../village/VillageActionChip';
import type { QuestState } from '../quests/types';

type JobsHallContentProps = {
  questState: QuestState;
  onSwitchJob: (jobSlug: string) => void;
  embedded?: boolean;
};

const CHOOSEABLE_JOBS = Object.values(JOB_REGISTRY).filter((job) => job.slug !== JOB_SLUG_EXPLORER);

const sectionLabel = `${RPG_UI_CAPTION} uppercase tracking-[0.12em]`;

export function JobsHallContent({ questState, onSwitchJob, embedded = false }: JobsHallContentProps) {
  const activeSlug = questState.activeJobSlug;
  const activeJob = activeSlug ? JOB_REGISTRY[activeSlug] : undefined;

  const resourceEntries = Object.entries(questState.resources ?? {}).filter(([, n]) => n > 0);

  return (
    <div className="space-y-2">
      <p className={RPG_UI_META}>
        Your profession stays active until you switch. Choose once, and it remains selected.
      </p>

      {activeJob ? (
        <div className="rounded-md border border-[var(--candle-flame-soft)]/30 bg-black/20 px-2 py-1.5">
          <p className={sectionLabel}>Active</p>
          <p className={cn(RPG_UI_UI, 'font-medium text-[var(--candle-wax)]')}>{activeJob.displayName}</p>
          <p className={cn(RPG_UI_CAPTION, 'mt-0.5')}>{activeJob.description}</p>
        </div>
      ) : null}

      <div className="space-y-1">
        <p className={sectionLabel}>Professions</p>
        {CHOOSEABLE_JOBS.map((job) => {
          const isActive = activeSlug === job.slug;
          return (
            <div
              key={job.slug}
              className="rounded-md border border-[var(--candle-rule)]/80 bg-black/25 px-2 py-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn(RPG_UI_UI, 'font-medium text-[var(--candle-ink)]')}>{job.displayName}</p>
                  <p className={RPG_UI_CAPTION}>{job.hallLabel}</p>
                </div>
                {isActive ? (
                  <span className={cn(RPG_UI_CAPTION, 'uppercase text-[var(--candle-flame-soft)]')}>
                    Active
                  </span>
                ) : null}
              </div>
              <p className={cn(RPG_UI_CAPTION, 'mt-0.5')}>{job.description}</p>
              {!isActive ? (
                embedded ? (
                  <VillageActionRow className="mt-1">
                    <VillageActionRowItem>
                      <VillageActionChip onClick={() => onSwitchJob(job.slug)}>
                        Switch to {job.displayName}
                      </VillageActionChip>
                    </VillageActionRowItem>
                  </VillageActionRow>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-1.5 w-full font-serif text-xs"
                    onClick={() => onSwitchJob(job.slug)}
                  >
                    Switch to {job.displayName}
                  </Button>
                )
              ) : null}
            </div>
          );
        })}
      </div>

      {resourceEntries.length > 0 ? (
        <div className="space-y-0.5 border-t border-[var(--candle-rule)] pt-2">
          <p className={sectionLabel}>Stockpile</p>
          <ul className={RPG_UI_CAPTION}>
            {resourceEntries.map(([key, amount]) => (
              <li key={key}>
                {formatResourceLabel(key)}: {amount}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

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
  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Jobs Hall"
      panelClassName="h-auto max-h-[min(90vh,640px)]"
    >
      <GamePanelDialogTitle>Jobs Hall</GamePanelDialogTitle>
      <GamePanelScroll className="min-h-0 flex-1 pr-3">
        <JobsHallContent questState={questState} onSwitchJob={onSwitchJob} />
      </GamePanelScroll>
    </GamePanelDialog>
  );
}
