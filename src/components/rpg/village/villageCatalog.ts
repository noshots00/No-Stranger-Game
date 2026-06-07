import { DISCOVERED_CEMETERY_FLAG } from '../constants';

export type VillagePanelId =
  | 'arena'
  | 'blobbiFighting'
  | 'tavern'
  | 'market'
  | 'townHall'
  | 'craftersCorner';

export type VillageLotKind = 'system' | 'stub' | 'travel';

export type VillageLotAction =
  | { type: 'panel'; panel: VillagePanelId }
  | { type: 'travel'; locationId: string }
  | { type: 'stub' };

export type VillageLotDef = {
  id: string;
  label: string;
  kind: VillageLotKind;
  action?: VillageLotAction;
  /** Quest flag required to show this lot (e.g. discovery). */
  requiresFlag?: string;
};

export type VillageDistrictDef = {
  id: string;
  title: string;
  lots: VillageLotDef[];
};

export const VILLAGE_LEAVE_DISTRICT_ID = 'leave-village';

export const VILLAGE_BUILDING_DISTRICT_IDS: ReadonlySet<string> = new Set([
  'town-square',
  'market-row',
  'forge-lane',
]);

export const VILLAGE_DISTRICTS: ReadonlyArray<VillageDistrictDef> = [
  {
    id: 'town-square',
    title: 'Town Square',
    lots: [
      {
        id: 'town-hall',
        label: 'Town Hall',
        kind: 'system',
        action: { type: 'panel', panel: 'townHall' },
      },
      {
        id: 'arena',
        label: 'Arena',
        kind: 'system',
        action: { type: 'panel', panel: 'arena' },
      },
      {
        id: 'blobbi-fighting',
        label: 'Blobbi Fighting',
        kind: 'system',
        action: { type: 'panel', panel: 'blobbiFighting' },
      },
    ],
  },
  {
    id: 'market-row',
    title: 'Market Row',
    lots: [
      {
        id: 'tavern',
        label: 'Tavern',
        kind: 'system',
        action: { type: 'panel', panel: 'tavern' },
      },
      {
        id: 'market',
        label: 'Market',
        kind: 'system',
        action: { type: 'panel', panel: 'market' },
      },
    ],
  },
  {
    id: 'forge-lane',
    title: 'Forge Lane',
    lots: [
      {
        id: 'crafters-corner',
        label: "Crafter's Corner",
        kind: 'system',
        action: { type: 'panel', panel: 'craftersCorner' },
      },
    ],
  },
  {
    id: VILLAGE_LEAVE_DISTRICT_ID,
    title: 'Leave village',
    lots: [
      {
        id: 'forest-travel',
        label: 'Return to Forest',
        kind: 'travel',
        action: { type: 'travel', locationId: 'Forest' },
      },
      {
        id: 'cemetery-travel',
        label: 'Cemetery',
        kind: 'travel',
        action: { type: 'travel', locationId: 'Cemetery' },
        requiresFlag: DISCOVERED_CEMETERY_FLAG,
      },
    ],
  },
];

export function isVillageLotVisible(lot: VillageLotDef, flags: readonly string[]): boolean {
  if (lot.requiresFlag && !flags.includes(lot.requiresFlag)) return false;
  return true;
}

function filterDistrictLots(
  district: VillageDistrictDef,
  flags: readonly string[]
): VillageDistrictDef | null {
  const lots = district.lots.filter((lot) => isVillageLotVisible(lot, flags));
  if (lots.length === 0) return null;
  return { ...district, lots };
}

export function visibleBuildingDistricts(flags: readonly string[]): VillageDistrictDef[] {
  return VILLAGE_DISTRICTS.filter((d) => VILLAGE_BUILDING_DISTRICT_IDS.has(d.id))
    .map((d) => filterDistrictLots(d, flags))
    .filter((d): d is VillageDistrictDef => d !== null);
}

export function visibleLeaveDistrict(flags: readonly string[]): VillageDistrictDef | null {
  const leave = VILLAGE_DISTRICTS.find((d) => d.id === VILLAGE_LEAVE_DISTRICT_ID);
  if (!leave) return null;
  return filterDistrictLots(leave, flags);
}
