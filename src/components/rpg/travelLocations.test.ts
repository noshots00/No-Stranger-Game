import { describe, expect, it } from 'vitest';
import {
  ANCIENT_CEMETERY_DISCOVERED_FLAG,
  ANCIENT_CEMETERY_LOCATION,
  QUEST_DYERS_CRYPT_ID,
} from './constants';
import { createInitialQuestState } from './quests/engine';
import {
  buildForestTravelMenuItems,
  ensureAncientCemeteryDiscoveryFlags,
  isAncientCemeteryTravelUnlocked,
} from './travelLocations';

describe('Ancient Cemetery travel', () => {
  it("is hidden when Dyer's Crypt is unveiled but the player has not followed the skeleton", () => {
    const state = {
      ...createInitialQuestState(),
      unveiledQuestIds: [QUEST_DYERS_CRYPT_ID],
      progressByQuestId: {
        [QUEST_DYERS_CRYPT_ID]: {
          currentStepId: 'skeleton-intro',
          isCompleted: false,
          choiceHistory: [],
        },
      },
    };
    expect(isAncientCemeteryTravelUnlocked(state)).toBe(false);
    const items = buildForestTravelMenuItems((id) => id, state);
    expect(items.some((item) => item.locationId === ANCIENT_CEMETERY_LOCATION)).toBe(false);
  });

  it('stays hidden from the travel menu while menu travel is disabled', () => {
    const state = {
      ...createInitialQuestState(),
      flags: [ANCIENT_CEMETERY_DISCOVERED_FLAG],
    };
    expect(isAncientCemeteryTravelUnlocked(state)).toBe(false);
    const items = buildForestTravelMenuItems((id) => id, state);
    expect(items.some((item) => item.locationId === ANCIENT_CEMETERY_LOCATION)).toBe(false);
  });

  it('repairs the discovery flag for saves already on the follow path', () => {
    const flags = ensureAncientCemeteryDiscoveryFlags({
      flags: [],
      progressByQuestId: {
        [QUEST_DYERS_CRYPT_ID]: {
          currentStepId: 'skeleton-cemetery-approach',
          choiceHistory: ['skeleton-follow'],
        },
      },
      currentLocation: 'Forest',
      forestSubLocation: null,
    });
    expect(flags).toContain(ANCIENT_CEMETERY_DISCOVERED_FLAG);
  });

  it('repairs the discovery flag when the player hid and found the cemetery', () => {
    const flags = ensureAncientCemeteryDiscoveryFlags({
      flags: [],
      progressByQuestId: {
        [QUEST_DYERS_CRYPT_ID]: {
          currentStepId: 'skeleton-find-cemetery',
          choiceHistory: ['skeleton-hide'],
        },
      },
      currentLocation: 'Forest',
      forestSubLocation: null,
    });
    expect(flags).toContain(ANCIENT_CEMETERY_DISCOVERED_FLAG);
  });
});
