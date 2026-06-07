import {
  QUEST_VILLAGE_ARRIVAL_ID,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const SHANNON_PORTRAIT = 'art/converted/wa195531.webp';

/** Village onboarding — Shannon welcomes the traveler before Pick a job. */
export const quest042MayorShannon = createQuestDefinition({
  id: 'quest-042-mayor-shannon',
  title: 'Mayor Shannon',
  briefing: 'As you are nearing the village, an old man approaches you.',
  createdAt: 42,
  startStepId: 'shannon-talk',
  requiredPlayLocation: 'Village',
  isAvailable: makeQuestAvailability({
    requiresAnyFlags: [VILLAGE_PHASE_FLAG],
    requiresAnyCompletedQuestIds: [QUEST_VILLAGE_ARRIVAL_ID],
  }),
  journalSummaryFallback: 'Shannon welcomed you to the village.',
  steps: [
    {
      id: 'shannon-talk',
      type: 'choice',
      npcTalkId: 'shannon',
      text: '',
      visuals: [{ kind: 'image', src: SHANNON_PORTRAIT, alt: 'Mayor Shannon' }],
      choices: [
        {
          id: 'shannon-thanks',
          label: 'Thanks',
          completeQuest: true,
        },
      ],
    },
  ],
});
