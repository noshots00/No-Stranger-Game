import { FOREST_PARENT_LOCATION, OLD_WELL_LOCATION, VALID_SAVE_LOCATIONS } from './constants';
import type { QuestState } from './quests/types';

/** Forest sub-destinations (header still shows The Forest). */
export function isForestSubLocation(locationId: string): boolean {
  return locationId === OLD_WELL_LOCATION;
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

/** Header location indicator — never Old Well (player remains in the forest). */
export function headerDisplayLocation(state: Pick<QuestState, 'currentLocation' | 'forestSubLocation'>): string {
  if (state.currentLocation === OLD_WELL_LOCATION) return FOREST_PARENT_LOCATION;
  return state.currentLocation;
}

/** Which travel-menu row is highlighted (forest parent vs Old Well child). */
export function travelMenuHighlightLocation(
  state: Pick<QuestState, 'currentLocation' | 'forestSubLocation'>
): string {
  if (state.forestSubLocation) return state.forestSubLocation;
  if (state.currentLocation === OLD_WELL_LOCATION) return OLD_WELL_LOCATION;
  return state.currentLocation;
}

export function applyTravelLocationChange(state: QuestState, nextLocation: string): QuestState {
  if (nextLocation === OLD_WELL_LOCATION) {
    return {
      ...state,
      currentLocation: FOREST_PARENT_LOCATION,
      forestSubLocation: OLD_WELL_LOCATION,
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
  if (sub !== OLD_WELL_LOCATION) {
    sub = null;
  }
  if (loc !== FOREST_PARENT_LOCATION) {
    sub = null;
  }
  return { currentLocation: loc, forestSubLocation: sub };
}
