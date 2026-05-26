import {
  DISCOVERED_CEMETERY_FLAG,
  JOB_SLUG_ADVENTURER,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

export const quest037DiscoverCemetery = createQuestDefinition({
  id: 'quest-037-discover-cemetery',
  title: 'The Cemetery',
  briefing: 'A crooked gate and sunken headstones — something stirs below.',
  createdAt: 37,
  startStepId: 'cemetery-approach',
  isAvailable: makeQuestAvailability({
    requiresAnyFlags: [VILLAGE_PHASE_FLAG],
  }),
  journalSummaryFallback: 'You found the forest cemetery and its crypt.',
  steps: [
    {
      id: 'cemetery-approach',
      type: 'choice',
      text: 'Mossy iron gates lean open. Cold air breathes from a stairwell into the crypt.',
      choices: [
        {
          id: 'cemetery-enter',
          label: 'Mark the site for the village',
          completeQuest: true,
          effects: {
            flagsSet: [DISCOVERED_CEMETERY_FLAG],
            unlockJobSlugs: [JOB_SLUG_ADVENTURER],
            setCurrentLocation: 'Cemetery',
          },
          worldEventLogAdd: ['{playerName} discovered the forest cemetery.'],
          journalSummaryLineAdd: 'You discovered the cemetery with its crypt.',
        },
      ],
    },
  ],
});
