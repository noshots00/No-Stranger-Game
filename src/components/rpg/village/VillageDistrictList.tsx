import { useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { NewDot } from '../NewDot';
import { RPG_CHOICE_GRID, RPG_COMMAND_CHIP, RPG_VILLAGE_HUB_BANNER } from '../typography/rpgUiTypography';

import { VILLAGE_MAP_SRC } from './villageArt';
import {
  visibleBuildingDistricts,
  type VillageDistrictDef,
  type VillageLotDef,
  type VillagePanelId,
} from './villageCatalog';

type VillageDistrictListProps = {
  questFlags: string[];
  onOpenPanel: (panel: VillagePanelId) => void;
  onTravelToLocation: (locationId: string) => void;
  /** Tutorial ping on Town Hall lot (Pick a job / Mayor quests). */
  townHallPing?: boolean;
};

function isLotClickable(lot: VillageLotDef): boolean {
  return lot.kind === 'system' || lot.kind === 'travel' || lot.kind === 'stub';
}

function VillageLotRow({
  lot,
  district,
  townHallPing,
  onLotClick,
}: {
  lot: VillageLotDef;
  district: VillageDistrictDef;
  townHallPing: boolean;
  onLotClick: (lot: VillageLotDef, district: VillageDistrictDef) => void;
}) {
  const clickable = isLotClickable(lot);
  const chipClass = cn(
    RPG_COMMAND_CHIP,
    lot.kind === 'system' && 'village-location-chip--featured'
  );

  if (clickable) {
    return (
      <button type="button" className={chipClass} onClick={() => onLotClick(lot, district)}>
        <span className="inline-flex max-w-full items-center gap-1 whitespace-nowrap">
          <span className="truncate">{lot.label}</span>
          {lot.id === 'town-hall' && townHallPing ? <NewDot /> : null}
        </span>
      </button>
    );
  }

  return (
    <span className={cn(chipClass, 'village-location-chip--muted')} aria-disabled>
      <span className="whitespace-nowrap">{lot.label}</span>
    </span>
  );
}

export function VillageDistrictList({
  questFlags,
  onOpenPanel,
  onTravelToLocation,
  townHallPing = false,
}: VillageDistrictListProps) {
  const { toast } = useToast();
  const buildingLots = useMemo(
    () =>
      visibleBuildingDistricts(questFlags).flatMap((district) =>
        district.lots.map((lot) => ({ lot, district }))
      ),
    [questFlags]
  );

  const onStubVisit = useCallback(
    (label: string) => {
      toast({ title: label, description: 'Visiting this building is not implemented yet.' });
    },
    [toast]
  );

  const handleLotClick = useCallback(
    (lot: VillageLotDef, _district: VillageDistrictDef) => {
      if (!lot.action) return;
      if (lot.action.type === 'panel') onOpenPanel(lot.action.panel);
      else if (lot.action.type === 'travel') onTravelToLocation(lot.action.locationId);
      else onStubVisit(lot.label);
    },
    [onOpenPanel, onStubVisit, onTravelToLocation]
  );

  return (
    <div className="px-0.5">
      <div className={cn('village-location-cloud-panel', RPG_VILLAGE_HUB_BANNER)}>
        <img src={VILLAGE_MAP_SRC} alt="" className="village-location-cloud-panel__art" />
        <ul className={cn(RPG_CHOICE_GRID, 'village-location-cloud')} role="list">
          {buildingLots.map(({ lot, district }) => (
            <li key={lot.id}>
              <VillageLotRow
                lot={lot}
                district={district}
                townHallPing={townHallPing}
                onLotClick={handleLotClick}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
