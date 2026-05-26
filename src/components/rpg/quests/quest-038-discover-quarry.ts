import {
  DISCOVERED_QUARRY_FLAG,
  JOB_SLUG_STONECUTTER,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

export const quest038DiscoverQuarry = createQuestDefinition({
  id: 'quest-038-discover-quarry',
  title: 'The Quarry',
  briefing: 'An old cut in the hillside — stone enough to build a town hall twice over.',
  createdAt: 38,
  startStepId: 'quarry-approach',
  isAvailable: makeQuestAvailability({
    requiresAnyFlags: [VILLAGE_PHASE_FLAG],
  }),
  journalSummaryFallback: 'You found the forest quarry.',
  steps: [
    {
      id: 'quarry-approach',
      type: 'choice',
      text: 'Chisel marks and rope scars line the rock face. The village could use this stone.',
      choices: [
        {
          id: 'quarry-claim',
          label: 'Stake a claim for the masons',
          completeQuest: true,
          effects: {
            flagsSet: [DISCOVERED_QUARRY_FLAG],
            unlockJobSlugs: [JOB_SLUG_STONECUTTER],
            setCurrentLocation: 'Quarry',
          },
          worldEventLogAdd: ['{playerName} discovered the forest quarry.'],
          journalSummaryLineAdd: 'You discovered the quarry.',
        },
      ],
    },
  ],
});
