/** Mayor-selected active village upgrade (addressable; latest per `d`). */
export const NSG_VILLAGE_PROJECT_KIND = 30340;
/** Player contribution toward a project (regular events). */
export const NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND = 30341;

export const VILLAGE_PROJECT_COMMUNITY_TAG = 'village';
export const VILLAGE_PROJECT_DEF_TAG = 'village-project';
export const VILLAGE_PROJECT_CONTRIBUTION_TAG = 'village-project-contribution';

export const VILLAGE_PROJECT_ACTIVE_D_TAG = 'village-project-active';

export const VILLAGE_PROJECT_QUERY_LIMIT = 80;
export const VILLAGE_PROJECT_FEED_STALE_MS = 20_000;

export type VillageProjectResource = 'stone' | 'iron';

export const VILLAGE_PROJECT_CATALOG: ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  goals: Partial<Record<VillageProjectResource, number>>;
}> = [
  {
    id: 'build-town-hall',
    title: 'Build the Town Hall',
    description: 'Raise walls and a records office for the village ledger.',
    goals: { stone: 500, iron: 200 },
  },
  {
    id: 'repair-quarry-road',
    title: 'Repair the Quarry Road',
    description: 'Stone blocks and iron fittings for a safe cart path.',
    goals: { stone: 300, iron: 80 },
  },
  {
    id: 'deepen-mine-shaft',
    title: 'Deepen the Mine Shaft',
    description: 'Brace the lower gallery before winter floods the cut.',
    goals: { stone: 150, iron: 350 },
  },
];
