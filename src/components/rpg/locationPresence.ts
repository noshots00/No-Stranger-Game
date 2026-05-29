import {
  ANCIENT_CEMETERY_LOCATION,
  FOREST_PARENT_LOCATION,
  OLD_WELL_LOCATION,
  VALID_SAVE_LOCATIONS,
} from './constants';
import type { QuestState } from './quests/types';

const FOREST_SUB_LOCATIONS = new Set<string>([OLD_WELL_LOCATION, ANCIENT_CEMETERY_LOCATION]);

/** Forest sub-destinations (header still shows The Forest). */
export function isForestSubLocation(locationId: string): boolean {
  return FOREST_SUB_LOCATIONS.has(locationId);
}

export function isPlayerAtLocation(
  presence: Pick<QuestState, 'currentLocation' | 'forestSubLocation'>,
  locationId: string
): boolean {
  if (presence.currentLocation === locationId) return true;
  return (
    isForestSubLocation(locationId) &&
    presence.currentLocation === FOREST_PARENT_LOCATION &&
    presence.forestSubLocation === locationId
  );
}

/** Header location indicator — never forest sub-locations (player remains in the forest). */
export function headerDisplayLocation(state: Pick<QuestState, 'currentLocation' | 'forestSubLocation'>): string {
  if (state.forestSubLocation && FOREST_SUB_LOCATIONS.has(state.forestSubLocation)) {
    return FOREST_PARENT_LOCATION;
  }
  if (state.currentLocation === OLD_WELL_LOCATION || state.currentLocation === ANCIENT_CEMETERY_LOCATION) {
    return FOREST_PARENT_LOCATION;
  }
  return state.currentLocation;
}

/** Which travel-menu row is highlighted (forest parent vs forest child). */
export function travelMenuHighlightLocation(
  state: Pick<QuestState, 'currentLocation' | 'forestSubLocation'>
): string {
  if (state.forestSubLocation) return state.forestSubLocation;
  if (state.currentLocation === OLD_WELL_LOCATION) return OLD_WELL_LOCATION;
  if (state.currentLocation === ANCIENT_CEMETERY_LOCATION) return ANCIENT_CEMETERY_LOCATION;
  return state.currentLocation;
}

export function applyTravelLocationChange(state: QuestState, nextLocation: string): QuestState {
  if (nextLocation === OLD_WELL_LOCATION || nextLocation === ANCIENT_CEMETERY_LOCATION) {
    return {
      ...state,
      currentLocation: FOREST_PARENT_LOCATION,
      forestSubLocation: nextLocation,
    };
  }
  if (nextLocation === FOREST_PARENT_LOCATION) {
    return {
      ...state,
      currentLocation: FOREST_PARENT_LOCATION,
      forestSubLocation: null,
    };
  }
  const currentLocation = VALID_SAVE_LOCATIONS.has(nextLocation) ? nextLocation : state.currentLocation;
  return {
    ...state,
    currentLocation,
    forestSubLocation: null,
  };
}

export function normalizeForestLocationFields(
  currentLocation: string,
  forestSubLocation: string | null | undefined
): { currentLocation: string; forestSubLocation: string | null } {
  let loc = currentLocation;
  let sub =
    typeof forestSubLocation === 'string' && forestSubLocation.trim().length > 0
      ? forestSubLocation.trim()
      : null;

  if (loc === OLD_WELL_LOCATION) {
    loc = FOREST_PARENT_LOCATION;
    sub = OLD_WELL_LOCATION;
  }
  if (loc === ANCIENT_CEMETERY_LOCATION) {
    loc = FOREST_PARENT_LOCATION;
    sub = ANCIENT_CEMETERY_LOCATION;
  }
  if (!sub || !FOREST_SUB_LOCATIONS.has(sub)) {
    sub = null;
  }
  if (loc !== FOREST_PARENT_LOCATION) {
    sub = null;
  }
  return { currentLocation: loc, forestSubLocation: sub };
}
