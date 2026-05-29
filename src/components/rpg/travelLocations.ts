import {
  ANCIENT_CEMETERY_DISCOVERED_FLAG,
  ANCIENT_CEMETERY_LOCATION,
  FOREST_PARENT_LOCATION,
  QUEST_DYERS_CRYPT_ID,
} from './constants';
import type { QuestState } from './quests/types';

const LEGACY_WANDERING_SKELETON_QUEST_ID = 'quest-006-wandering-skeleton';

function isDyersCryptQuestCompleted(state: QuestState): boolean {
  const prog = state.progressByQuestId;
  return (
    prog[QUEST_DYERS_CRYPT_ID]?.isCompleted === true ||
    prog[LEGACY_WANDERING_SKELETON_QUEST_ID]?.isCompleted === true
  );
}

export type TravelMenuItem = {
  locationId: string;
  label: string;
  indent?: boolean;
  showNew?: boolean;
};

/**
 * When true, Ancient Cemetery appears under The Forest in the travel menu after discovery.
 * Quest beats may still set `currentLocation` to the cemetery; re-enable menu travel later.
 */
export const ANCIENT_CEMETERY_TRAVEL_IN_MENU = false;

/** Ancient Cemetery travel menu row (disabled until `ANCIENT_CEMETERY_TRAVEL_IN_MENU`). */
export function isAncientCemeteryTravelUnlocked(state: Pick<QuestState, 'flags'>): boolean {
  if (!ANCIENT_CEMETERY_TRAVEL_IN_MENU) return false;
  return state.flags.includes(ANCIENT_CEMETERY_DISCOVERED_FLAG);
}

const SKELETON_CEMETERY_PATH_STEP_IDS = new Set([
  'skeleton-cemetery-approach',
  'skeleton-cemetery-found',
  'skeleton-find-cemetery',
  'skeleton-flee-into-cemetery',
  'skeleton-sneak-away',
  'skeleton-inside-gate',
  'skeleton-fight-outcome',
  'skeleton-escaped',
]);

const SKELETON_CEMETERY_DISCOVERY_CHOICE_IDS = new Set([
  'skeleton-follow',
  'skeleton-hide',
  'skeleton-attack-flee',
  'skeleton-cast-flee',
]);

/**
 * Repair saves mid-follow or at the cemetery before the discovery flag existed.
 */
export function ensureAncientCemeteryDiscoveryFlags(args: {
  flags: string[];
  progressByQuestId: Record<string, { currentStepId: string; choiceHistory?: string[] }>;
  currentLocation: string;
  forestSubLocation: string | null;
}): string[] {
  if (args.flags.includes(ANCIENT_CEMETERY_DISCOVERED_FLAG)) return args.flags;
  const crypt = args.progressByQuestId[QUEST_DYERS_CRYPT_ID];
  const onCemeteryPath =
    (crypt && SKELETON_CEMETERY_PATH_STEP_IDS.has(crypt.currentStepId)) ||
    crypt?.choiceHistory?.some((id) => SKELETON_CEMETERY_DISCOVERY_CHOICE_IDS.has(id)) === true;
  const atCemetery =
    args.currentLocation === ANCIENT_CEMETERY_LOCATION ||
    args.forestSubLocation === ANCIENT_CEMETERY_LOCATION;
  if (!onCemeteryPath && !atCemetery) return args.flags;
  return [...args.flags, ANCIENT_CEMETERY_DISCOVERED_FLAG];
}

export function hasAcknowledgedTravelLocation(state: QuestState, locationId: string): boolean {
  return (state.acknowledgedTravelLocationIds ?? []).includes(locationId);
}

export function acknowledgeTravelLocation(state: QuestState, locationId: string): QuestState {
  const existing = state.acknowledgedTravelLocationIds ?? [];
  if (existing.includes(locationId)) return state;
  return {
    ...state,
    acknowledgedTravelLocationIds: [...existing, locationId],
  };
}

/** Clears the single “discovered Ancient Cemetery” travel ping (header + sub-item). */
export function acknowledgeAncientCemeteryTravelDiscovery(state: QuestState): QuestState {
  let next = acknowledgeTravelLocation(state, ANCIENT_CEMETERY_LOCATION);
  next = acknowledgeTravelLocation(next, FOREST_PARENT_LOCATION);
  return next;
}

/**
 * Forest sub-location discovery ping: header + indented cemetery row.
 */
export function forestTravelNotificationsPending(state: QuestState): {
  header: boolean;
  forest: boolean;
  ancientCemetery: boolean;
} {
  if (!isAncientCemeteryTravelUnlocked(state) || isDyersCryptQuestCompleted(state)) {
    return { header: false, forest: false, ancientCemetery: false };
  }
  const cemeterySeen = hasAcknowledgedTravelLocation(state, ANCIENT_CEMETERY_LOCATION);
  const showDiscoveryPing = !cemeterySeen;
  return {
    forest: false,
    ancientCemetery: showDiscoveryPing,
    header: showDiscoveryPing,
  };
}

export function buildForestTravelMenuItems(
  formatLabel: (locationId: string) => string,
  state: QuestState
): TravelMenuItem[] {
  const pings = forestTravelNotificationsPending(state);
  const items: TravelMenuItem[] = [
    {
      locationId: FOREST_PARENT_LOCATION,
      label: formatLabel(FOREST_PARENT_LOCATION),
      showNew: pings.forest,
    },
  ];
  if (isAncientCemeteryTravelUnlocked(state)) {
    items.push({
      locationId: ANCIENT_CEMETERY_LOCATION,
      label: formatLabel(ANCIENT_CEMETERY_LOCATION),
      indent: true,
      showNew: pings.ancientCemetery,
    });
  }
  return items;
}

/** @deprecated Legacy Old Well travel; kept for saves that still reference it. */
export function isOldWellTravelUnlocked(state: Pick<QuestState, 'unveiledQuestIds'>): boolean {
  return state.unveiledQuestIds.includes('quest-002-b-will-i-starve');
}

/** @deprecated Use `acknowledgeAncientCemeteryTravelDiscovery`. */
export function acknowledgeOldWellTravelDiscovery(state: QuestState): QuestState {
  return acknowledgeAncientCemeteryTravelDiscovery(state);
}

export { QUEST_DYERS_CRYPT_ID };
