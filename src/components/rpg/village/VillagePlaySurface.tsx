import { useCallback, useMemo } from 'react';

import { useCurrentUser } from '@/hooks/useCurrentUser';

import { VillageDistrictList } from './VillageDistrictList';
import { VillageFeedRefreshButton } from './VillageFeedRefreshButton';
import type { VillagePanelId } from './villageCatalog';
import type { VillageLotOccupancyView } from './villageLotNostr';
import { useVillageLots } from './useVillageLots';

type VillagePlaySurfaceProps = {
  questFlags: string[];
  playerName: string;
  onOpenArena: () => void;
  onOpenGuildAlley: () => void;
  onOpenTavern: () => void;
  onOpenMarket: () => void;
  onOpenMayorsHut: () => void;
  onOpenCraftersCorner: () => void;
  onOpenJobsHall: () => void;
  onOpenVillageProjects: () => void;
  onTravelToLocation: (locationId: string) => void;
};

export function VillagePlaySurface({
  questFlags,
  playerName,
  onOpenArena,
  onOpenGuildAlley,
  onOpenTavern,
  onOpenMarket,
  onOpenMayorsHut,
  onOpenCraftersCorner,
  onOpenJobsHall,
  onOpenVillageProjects,
  onTravelToLocation,
}: VillagePlaySurfaceProps) {
  const { user } = useCurrentUser();
  const displayName = playerName.trim() || 'Stranger';

  const { feedQuery, occupancyByLotId: occupancyFromFeed, claimLot, buildLot, invalidateFeed } =
    useVillageLots({
      enabled: true,
      ownerName: displayName,
      myPubkey: user?.pubkey,
    });

  const emptyLots = useMemo(() => new Map<string, VillageLotOccupancyView>(), []);
  const occupancyByLotId = occupancyFromFeed ?? emptyLots;

  const onOpenPanel = useCallback(
    (panel: VillagePanelId) => {
      if (panel === 'arena') onOpenArena();
      else if (panel === 'guildAlley') onOpenGuildAlley();
      else if (panel === 'tavern') onOpenTavern();
      else if (panel === 'market') onOpenMarket();
      else if (panel === 'mayorsHut') onOpenMayorsHut();
      else if (panel === 'craftersCorner') onOpenCraftersCorner();
      else if (panel === 'jobsHall') onOpenJobsHall();
      else if (panel === 'villageProjects') onOpenVillageProjects();
    },
    [
      onOpenArena,
      onOpenGuildAlley,
      onOpenTavern,
      onOpenMarket,
      onOpenMayorsHut,
      onOpenCraftersCorner,
      onOpenJobsHall,
      onOpenVillageProjects,
    ]
  );

  return (
    <section
      className="relative isolate flex h-full min-h-0 flex-1 flex-col overflow-hidden px-1"
      aria-label="Village hub"
    >
      <header className="relative shrink-0 pb-1.5 pt-0.5">
        <h2 className="text-center font-cormorant text-base font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
          Strange Village
        </h2>
        <div className="absolute right-0 top-0.5">
          <VillageFeedRefreshButton
            isFetching={feedQuery.isFetching}
            onRefresh={() => void invalidateFeed()}
          />
        </div>
      </header>

      <VillageDistrictList
        questFlags={questFlags}
        myPubkey={user?.pubkey}
        occupancyByLotId={occupancyByLotId}
        isClaimPending={claimLot.isPending}
        isBuildPending={buildLot.isPending}
        onClaimLot={async (input) => {
          await claimLot.mutateAsync(input);
        }}
        onBuildLot={async (lotId) => {
          await buildLot.mutateAsync({ lotId });
        }}
        onOpenPanel={onOpenPanel}
        onTravelToLocation={onTravelToLocation}
      />
    </section>
  );
}
