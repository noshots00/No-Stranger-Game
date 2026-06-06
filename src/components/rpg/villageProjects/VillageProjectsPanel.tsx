import { Button } from '@/components/ui/button';
import { formatResourceLabel } from '../helpers';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelScroll } from '../GamePanelScroll';
import type { QuestState } from '../quests/types';
import type { useVillageProjects } from './useVillageProjects';
import type { VillageProjectResource } from './constants';

function goalLine(
  resource: VillageProjectResource,
  goal: number | undefined,
  total: number | undefined
): string | null {
  if (!goal) return null;
  const have = total ?? 0;
  return `${formatResourceLabel(resource)}: ${have} / ${goal}`;
}

type VillageProjectsContentProps = {
  questState: QuestState;
  villageProjects: ReturnType<typeof useVillageProjects>;
};

export function VillageProjectsContent({ questState, villageProjects }: VillageProjectsContentProps) {
  const { progress, catalog, isMayor, setActiveProject, contribute } = villageProjects;
  const def = progress.definition;
  const resources = questState.resources ?? {};
  const goalResources = def
    ? (Object.keys(def.goals) as VillageProjectResource[]).filter((key) => def.goals[key])
    : [];

  return (
    <div className="space-y-4 text-sm">
      {def ? (
        <div className="rounded-md border border-[var(--candle-flame-soft)]/30 bg-black/20 px-3 py-2">
          <p className="font-semibold text-[var(--candle-wax)]">{def.title}</p>
          <p className="mt-1 text-xs text-[var(--candle-ink-soft)]">{def.description}</p>
          <ul className="mt-2 space-y-0.5 text-xs text-[var(--candle-ink)]">
            {goalResources.map((resource) => {
              const line = goalLine(resource, def.goals[resource], progress.totals[resource]);
              return line ? <li key={resource}>{line}</li> : null;
            })}
          </ul>
          <div className="mt-3 flex flex-col gap-2">
            {goalResources.map((resource) => {
              const stock = resources[resource] ?? 0;
              return (
                <Button
                  key={resource}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full font-serif text-xs"
                  disabled={stock < 1 || contribute.isPending}
                  onClick={() => contribute.mutate({ resource, amount: 1 })}
                >
                  Contribute 1 {formatResourceLabel(resource)} (you have {stock})
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-[var(--candle-ink-soft)]">
          The mayor has not chosen a community project yet. Work your profession each day to stock logs
          and stone for village builds.
        </p>
      )}

      {isMayor ? (
        <div className="space-y-2 border-t border-[var(--candle-rule)] pt-3">
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-faint)]">
            Mayor — set active project
          </p>
          {catalog.map((row) => (
            <Button
              key={row.id}
              type="button"
              size="sm"
              variant="outline"
              className="w-full justify-start font-serif text-xs"
              disabled={setActiveProject.isPending}
              onClick={() => setActiveProject.mutate(row.id)}
            >
              {row.title}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="border-t border-[var(--candle-rule)] pt-2 text-[0.65rem] text-[var(--candle-ink-faint)]">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="font-serif text-xs"
          onClick={() => villageProjects.invalidateFeed()}
        >
          Refresh progress
        </Button>
      </div>
    </div>
  );
}

type VillageProjectsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: QuestState;
  villageProjects: ReturnType<typeof useVillageProjects>;
};

export function VillageProjectsPanel({
  open,
  onOpenChange,
  questState,
  villageProjects,
}: VillageProjectsPanelProps) {
  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Village Projects"
      panelClassName="h-auto max-h-[min(90vh,640px)]"
    >
      <GamePanelDialogTitle>Village Projects</GamePanelDialogTitle>
      <GamePanelScroll className="min-h-0 flex-1 pr-3">
        <VillageProjectsContent questState={questState} villageProjects={villageProjects} />
      </GamePanelScroll>
    </GamePanelDialog>
  );
}
