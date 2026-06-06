import { QUEST_PICK_A_JOB_ID, VILLAGE_PHASE_FLAG } from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

/** Village civic beat — cast a vote for mayor after choosing a profession. */
export const quest041Mayor = createQuestDefinition({
  id: 'quest-041-mayor',
  title: 'Mayor',
  briefing: 'Every voice matters — cast your vote at the Mayor\'s Hut.',
  createdAt: 41,
  startStepId: 'start',
  requiredPlayLocation: 'Village',
  isAvailable: makeQuestAvailability({
    requiresAnyFlags: [VILLAGE_PHASE_FLAG],
    requiresAnyCompletedQuestIds: [QUEST_PICK_A_JOB_ID],
  }),
  journalSummaryFallback: 'You voted for village mayor.',
  steps: [
    {
      id: 'start',
      type: 'choice',
      text: 'The village needs a mayor. Visit the Town Hall and cast your vote in the Mayor\'s Hut.',
      choices: [
        {
          id: 'go-town-hall',
          label: 'Go to Town Hall',
          nextStepId: 'await-vote',
        },
      ],
    },
    {
      id: 'await-vote',
      type: 'message',
      text: 'Choose a candidate on the ballot. Your vote is recorded on the relay for all villagers to see.',
    },
  ],
});
