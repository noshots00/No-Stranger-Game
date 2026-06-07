import { publicAsset } from '@/lib/publicAsset';

import { TAVERN_INNKEEPER_SRC } from '../tavern/tavernArt';
import type { VillagePanelId } from './villageCatalog';

export type VillageLocationBanner = {
  src: string;
  tagline: string;
  objectPosition?: string;
  leaveLabel: string;
};

const BATCH = 'art/converted';

export const VILLAGE_LOCATION_BANNERS: Record<VillagePanelId, VillageLocationBanner> = {
  tavern: {
    src: TAVERN_INNKEEPER_SRC,
    tagline: 'Welcome to the tavern!',
    objectPosition: 'center 20%',
    leaveLabel: 'Leave tavern',
  },
  townHall: {
    src: publicAsset(`${BATCH}/king-arthur.webp`),
    tagline: 'Town Hall',
    leaveLabel: 'Leave town hall',
  },
  arena: {
    src: publicAsset(`${BATCH}/ancient-war.webp`),
    tagline: 'Arena',
    leaveLabel: 'Leave arena',
  },
  market: {
    src: publicAsset(`${BATCH}/river-empire-stage.webp`),
    tagline: 'Market Row',
    leaveLabel: 'Leave market',
  },
  blobbiFighting: {
    src: publicAsset(`${BATCH}/giant-lobster.webp`),
    tagline: 'Blobbi Fighting',
    leaveLabel: 'Leave blobbi pit',
  },
  craftersCorner: {
    src: publicAsset(`${BATCH}/green-hand-statue.webp`),
    tagline: "Crafter's Corner",
    leaveLabel: "Leave crafter's corner",
  },
};

export function getVillageLocationBanner(panel: VillagePanelId): VillageLocationBanner {
  return VILLAGE_LOCATION_BANNERS[panel];
}
