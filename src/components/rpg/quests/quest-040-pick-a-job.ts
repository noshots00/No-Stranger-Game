import { QUEST_VILLAGE_ARRIVAL_ID, VILLAGE_PHASE_FLAG } from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

/** Village onboarding — player must choose a profession at the Jobs Hall. */
export const quest040PickAJob = createQuestDefinition({
  id: 'quest-040-pick-a-job',
  title: 'Pick a job',
  briefing: 'Visit the Town Hall and choose a profession.',
  createdAt: 40,
  startStepId: 'start',
  requiredPlayLocation: 'Village',
  isAvailable: makeQuestAvailability({
    requiresAnyFlags: [VILLAGE_PHASE_FLAG],
    requiresAnyCompletedQuestIds: [QUEST_VILLAGE_ARRIVAL_ID],
  }),
  journalSummaryFallback: 'You chose a profession at the Jobs Hall.',
  steps: [
    {
      id: 'start',
      type: 'choice',
      text: 'Every newcomer must choose how they earn their keep. Visit the Town Hall and pick a profession.',
      choices: [
        {
          id: 'go-jobs-hall',
          label: 'Continue',
          nextStepId: 'await-profession',
        },
      ],
    },
    {
      id: 'await-profession',
      type: 'message',
      text: 'Choose a profession from the board. Your selection becomes your daily trade until you switch again.',
    },
  ],
});
