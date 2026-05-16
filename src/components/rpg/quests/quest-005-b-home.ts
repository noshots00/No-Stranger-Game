import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const BATCH = 'art/converted/batch-2026-05-02_21-10-35';
const HOME_IMG = `${BATCH}/home.webp`;

/** Placeholder follow-up after “The Door” — smoke test for the quest chain. */
export const quest005BHome = createQuestDefinition({
  id: 'quest-005-b-home',
  title: 'Smoke test — home',
  briefing: 'Placeholder beat after the door (chain verification).',
  createdAt: 12,
  startStepId: 'home-intro',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-004-b-the-door'],
  }),
  journalSummaryFallback: 'Placeholder home beat completed.',
  steps: [
    {
      id: 'home-intro',
      type: 'choice',
      text:
        'The road keeps unwinding. This beat exists only to confirm the last quest finished and the chain still runs—no riddles, only a nod and a step forward.',
      visuals: [{ kind: 'image', src: HOME_IMG, alt: 'Home' }],
      choices: [
        {
          id: 'home-ack',
          label: 'Acknowledge',
          completeQuest: true,
        },
      ],
    },
  ],
});
