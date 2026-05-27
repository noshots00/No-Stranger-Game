import { describe, expect, it } from 'vitest';
import {
  createInitialQuestState,
  hydrateQuestStateFromSources,
  reconcileVillagePhaseState,
} from './engine';
import {
  DAY_PACING_ACTIVE_FLAG,
  JOB_SLUG_MINER,
  QUEST_VILLAGE_ARRIVAL_ID,
  VILLAGE_PHASE_FLAG,
} from '../constants';

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
    expect(merged.flags).toContain(DAY_PACING_ACTIVE_FLAG);
    expect(merged.currentLocation).toBe('Silver Lake');
    expect(merged.progressByQuestId[QUEST_VILLAGE_ARRIVAL_ID]?.isCompleted).toBe(true);
  });

  it('reconcileVillagePhaseState keeps valid forest travel after village', () => {
    const state = {
      ...createInitialQuestState(),
      flags: [VILLAGE_PHASE_FLAG],
      currentLocation: 'Forest',
    };
    const next = reconcileVillagePhaseState(state, 4);
    expect(next.currentLocation).toBe('Forest');
    expect(next.flags).toContain(DAY_PACING_ACTIVE_FLAG);
    expect(next.lastDailyXpDay).toBe(4);
  });

  it('mergeQuestStateOnHydrate keeps local active job when relay lacks job fields', () => {
    const relay = {
      ...createInitialQuestState(),
      flags: [VILLAGE_PHASE_FLAG],
      unlockedJobSlugs: ['explorer'],
      activeJobSlug: 'explorer',
    };
    const local = {
      ...relay,
      unlockedJobSlugs: ['explorer', JOB_SLUG_MINER],
      activeJobSlug: JOB_SLUG_MINER,
    };
    const merged = hydrateQuestStateFromSources(relay, local);
    expect(merged.activeJobSlug).toBe(JOB_SLUG_MINER);
    expect(merged.unlockedJobSlugs).toContain(JOB_SLUG_MINER);
  });
});
