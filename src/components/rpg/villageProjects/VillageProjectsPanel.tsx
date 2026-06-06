import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatResourceLabel } from '../helpers';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelScroll } from '../GamePanelScroll';
import { PanelUpdateButton } from '../PanelUpdateButton';
import { RPG_UI_CAPTION, RPG_UI_META, RPG_UI_UI } from '../typography/rpgUiTypography';
import {
  VillageActionChip,
  VillageActionRow,
  VillageActionRowItem,
} from '../village/VillageActionChip';
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

const sectionLabel = `${RPG_UI_CAPTION} uppercase tracking-[0.12em]`;

type VillageProjectsContentProps = {
  questState: QuestState;
  villageProjects: ReturnType<typeof useVillageProjects>;
  embedded?: boolean;
};

export function VillageProjectsContent({
  questState,
  villageProjects,
  embedded = false,
}: VillageProjectsContentProps) {
  const { feedQuery, progress, catalog, isMayor, setActiveProject, contribute, refreshFeed } =
    villageProjects;
  const def = progress.definition;
  const resources = questState.resources ?? {};
  const goalResources = def
    ? (Object.keys(def.goals) as VillageProjectResource[]).filter((key) => def.goals[key])
    : [];

  return (
    <div className="space-y-2">
      <PanelUpdateButton
        label="Update projects"
        onClick={() => refreshFeed()}
        isFetching={feedQuery.isFetching}
        showLedgerHint={!feedQuery.isFetched}
        variant={embedded ? 'chip' : 'full'}
      />

      {feedQuery.isFetching ? (
        <p className={cn(RPG_UI_META, 'text-center')}>Updating…</p>
      ) : !feedQuery.isFetched ? (
        <p className={RPG_UI_META}>
          Tap Update projects to load the mayor&apos;s active build from the village ledger.
        </p>
      ) : def ? (
        <div className="rounded-md border border-[var(--candle-flame-soft)]/30 bg-black/20 px-2 py-1.5">
          <p className={cn(RPG_UI_UI, 'font-medium text-[var(--candle-wax)]')}>{def.title}</p>
          <p className={cn(RPG_UI_CAPTION, 'mt-0.5')}>{def.description}</p>
          <ul className={cn(RPG_UI_CAPTION, 'mt-1 space-y-0.5')}>
            {goalResources.map((resource) => {
              const line = goalLine(resource, def.goals[resource], progress.totals[resource]);
              return line ? <li key={resource}>{line}</li> : null;
            })}
          </ul>
          <div className="mt-1.5 space-y-0.5">
            {goalResources.map((resource) => {
              const stock = resources[resource] ?? 0;
              const label = `Contribute 1 ${formatResourceLabel(resource)} (${stock})`;
              return embedded ? (
                <VillageActionRow key={resource}>
                  <VillageActionRowItem>
                    <VillageActionChip
                      disabled={stock < 1 || contribute.isPending}
                      onClick={() => contribute.mutate({ resource, amount: 1 })}
                    >
                      {label}
                    </VillageActionChip>
                  </VillageActionRowItem>
                </VillageActionRow>
              ) : (
                <Button
                  key={resource}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full font-serif text-xs"
                  disabled={stock < 1 || contribute.isPending}
                  onClick={() => contribute.mutate({ resource, amount: 1 })}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className={RPG_UI_META}>
          The mayor has not chosen a community project yet. Work your profession each day to stock logs
          and stone for village builds.
        </p>
      )}

      {isMayor ? (
        <div className="space-y-1 border-t border-[var(--candle-rule)] pt-2">
          <p className={sectionLabel}>Mayor — set active project</p>
          {catalog.map((row) =>
            embedded ? (
              <VillageActionRow key={row.id}>
                <VillageActionRowItem>
                  <VillageActionChip
                    disabled={setActiveProject.isPending}
                    onClick={() => setActiveProject.mutate(row.id)}
                  >
                    {row.title}
                  </VillageActionChip>
                </VillageActionRowItem>
              </VillageActionRow>
            ) : (
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
            )
          )}
        </div>
      ) : null}
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
