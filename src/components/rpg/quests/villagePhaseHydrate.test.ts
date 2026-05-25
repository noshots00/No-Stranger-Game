import { describe, expect, it } from 'vitest';
import {
  createInitialQuestState,
  hydrateQuestStateFromSources,
  reconcileVillagePhaseState,
} from './engine';
import { QUEST_VILLAGE_ARRIVAL_ID, VILLAGE_PHASE_FLAG } from '../constants';

describe('village phase hydrate', () => {
  it('restores village hub when local has village-phase but relay does not', () => {
    const relay = createInitialQuestState();
    const local = {
      ...createInitialQuestState(),
      flags: [VILLAGE_PHASE_FLAG],
      currentLocation: 'Silver Lake',
      progressByQuestId: {
        [QUEST_VILLAGE_ARRIVAL_ID]: {
          currentStepId: 'village-arrival',
          isCompleted: true,
          choiceHistory: [],
        },
      },
    };
    const merged = hydrateQuestStateFromSources(relay, local);
    expect(merged.flags).toContain(VILLAGE_PHASE_FLAG);
    expect(merged.currentLocation).toBe('Village');
    expect(merged.progressByQuestId[QUEST_VILLAGE_ARRIVAL_ID]?.isCompleted).toBe(true);
  });

  it('reconcileVillagePhaseState sets location from flag', () => {
    const state = {
      ...createInitialQuestState(),
      flags: [VILLAGE_PHASE_FLAG],
      currentLocation: 'Forest',
    };
    const next = reconcileVillagePhaseState(state);
    expect(next.currentLocation).toBe('Village');
  });
});
