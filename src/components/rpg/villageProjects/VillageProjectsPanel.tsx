import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { Button } from '@/components/ui/button';
import { GamePanelScroll } from '../GamePanelScroll';
import type { useVillageProjects } from './useVillageProjects';
import type { VillageProjectResource } from './constants';

type VillageProjectsPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questState: import('../quests/types').QuestState;
  villageProjects: ReturnType<typeof useVillageProjects>;
};

function goalLine(
  resource: VillageProjectResource,
  goal: number | undefined,
  total: number | undefined
): string | null {
  if (!goal) return null;
  const have = total ?? 0;
  return `${resource}: ${have} / ${goal}`;
}

export function VillageProjectsPanel({
  open,
  onOpenChange,
  questState,
  villageProjects,
}: VillageProjectsPanelProps) {
  const { progress, catalog, isMayor, setActiveProject, contribute } = villageProjects;
  const def = progress.definition;
  const resources = questState.resources ?? {};

  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Village Projects"
      panelClassName="h-auto max-h-[min(90vh,640px)]"
    >
      <GamePanelDialogTitle>Village Projects</GamePanelDialogTitle>
      <GamePanelScroll className="min-h-0 flex-1 pr-3">
          <div className="space-y-4 text-sm">
            {def ? (
              <div className="rounded-md border border-[var(--candle-flame-soft)]/30 bg-black/20 px-3 py-2">
                <p className="font-semibold text-[var(--candle-wax)]">{def.title}</p>
                <p className="mt-1 text-xs text-[var(--candle-ink-soft)]">{def.description}</p>
                <ul className="mt-2 space-y-0.5 text-xs text-[var(--candle-ink)]">
                  {goalLine('stone', def.goals.stone, progress.totals.stone) ? (
                    <li>{goalLine('stone', def.goals.stone, progress.totals.stone)}</li>
                  ) : null}
                  {goalLine('iron', def.goals.iron, progress.totals.iron) ? (
                    <li>{goalLine('iron', def.goals.iron, progress.totals.iron)}</li>
                  ) : null}
                </ul>
                <div className="mt-3 flex flex-col gap-2">
                  {(['stone', 'iron'] as const).map((resource) => {
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
                        Contribute 1 {resource} (you have {stock})
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[var(--candle-ink-soft)]">
                The mayor has not chosen a community project yet. Work jobs in the forest to stock stone and
                iron.
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
      </GamePanelScroll>
    </GamePanelDialog>
  );
}
