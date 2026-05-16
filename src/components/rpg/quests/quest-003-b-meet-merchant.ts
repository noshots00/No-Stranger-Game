import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const BATCH = 'art/converted/batch-2026-05-02_21-10-35';

/** Unlock after quest 2b; introduces traveling merchant + location travel. */
export const quest003BMeetMerchant = createQuestDefinition({
  id: 'quest-003-b-meet-merchant',
  title: 'You meet a merchant',
  briefing: 'A stranger with a laden cart.',
  createdAt: 3,
  startStepId: 'meet-intro',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-002-b-will-i-starve'],
  }),
  journalSummaryFallback: 'Met a traveling merchant.',
  steps: [
    {
      id: 'meet-intro',
      type: 'message',
      text: 'You meet a traveling merchant.',
      nextStepId: 'meet-hint',
      visuals: [{ kind: 'image', src: `${BATCH}/dream-of-fae.webp`, alt: 'Forest reverie' }],
    },
    {
      id: 'meet-hint',
      type: 'message',
      text: 'You can visit the merchant by clicking the location button.',
      completeQuest: true,
    },
  ],
});
