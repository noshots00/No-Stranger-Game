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

export type VillageProjectResource = 'stone' | 'iron' | 'logs';

export const VILLAGE_PROJECT_CATALOG: ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  goals: Partial<Record<VillageProjectResource, number>>;
}> = [
  {
    id: 'lithic-workshop',
    title: 'Lithic Workshop',
    description: 'A stonecutters’ yard for shaping timber and masonry for the village.',
    goals: { logs: 500 },
  },
  {
    id: 'smelter-and-forge',
    title: 'Smelter and Forge',
    description: 'Timber frames and cut stone for a village smelter and forge.',
    goals: { logs: 1000, stone: 1000 },
  },
];
