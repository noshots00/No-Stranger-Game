import {
  DISCOVERED_MINE_FLAG,
  JOB_SLUG_MINER,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

export const quest039DiscoverMine = createQuestDefinition({
  id: 'quest-039-discover-mine',
  title: 'The Mine',
  briefing: 'A timbered mouth in the earth — iron smell and distant hammering.',
  createdAt: 39,
  startStepId: 'mine-approach',
  isAvailable: makeQuestAvailability({
    requiresAnyFlags: [VILLAGE_PHASE_FLAG],
  }),
  journalSummaryFallback: 'You found the forest mine.',
  steps: [
    {
      id: 'mine-approach',
      type: 'choice',
      text: 'Lantern hooks rust on the frame. The shaft drops into worked stone.',
      choices: [
        {
          id: 'mine-open',
          label: 'Report the shaft to the union',
          completeQuest: true,
          effects: {
            flagsSet: [DISCOVERED_MINE_FLAG],
            unlockJobSlugs: [JOB_SLUG_MINER],
            setCurrentLocation: 'Mine',
          },
          worldEventLogAdd: ['{playerName} discovered the forest mine.'],
          journalSummaryLineAdd: 'You discovered the mine.',
        },
      ],
    },
  ],
});
