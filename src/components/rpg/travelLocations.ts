import {
  FOREST_PARENT_LOCATION,
  OLD_WELL_LOCATION,
  QUEST_002B_WILL_I_STARVE_ID,
} from './constants';
import { getCompletedQuestIds } from './quests/engine';
import type { QuestState } from './quests/types';

function isOldWellQuestCompleted(state: QuestState): boolean {
  return getCompletedQuestIds(state).includes(QUEST_002B_WILL_I_STARVE_ID);
}

export type TravelMenuItem = {
  locationId: string;
  label: string;
  indent?: boolean;
  showNew?: boolean;
};

export function isOldWellTravelUnlocked(state: Pick<QuestState, 'unveiledQuestIds'>): boolean {
  return state.unveiledQuestIds.includes(QUEST_002B_WILL_I_STARVE_ID);
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

/** Clears the single “discovered Old Well” travel ping (header + sub-item). */
export function acknowledgeOldWellTravelDiscovery(state: QuestState): QuestState {
  let next = acknowledgeTravelLocation(state, OLD_WELL_LOCATION);
  next = acknowledgeTravelLocation(next, FOREST_PARENT_LOCATION);
  return next;
}

/**
 * Old Well unlock uses one discovery ping: header + indented Old Well row (not a separate Forest ping).
 */
export function forestTravelNotificationsPending(state: QuestState): {
  header: boolean;
  forest: boolean;
  oldWell: boolean;
} {
  if (!isOldWellTravelUnlocked(state) || isOldWellQuestCompleted(state)) {
    return { header: false, forest: false, oldWell: false };
  }
  const oldWellSeen = hasAcknowledgedTravelLocation(state, OLD_WELL_LOCATION);
  const showDiscoveryPing = !oldWellSeen;
  return {
    forest: false,
    oldWell: showDiscoveryPing,
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
  if (isOldWellTravelUnlocked(state)) {
    items.push({
      locationId: OLD_WELL_LOCATION,
      label: formatLabel(OLD_WELL_LOCATION),
      indent: true,
      showNew: pings.oldWell,
    });
  }
  return items;
}
