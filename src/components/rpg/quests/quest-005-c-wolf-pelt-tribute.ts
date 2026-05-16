import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const BATCH = 'art/converted/batch-2026-05-02_21-10-35';
const CARD_IMG = `${BATCH}/pleasant-forest.webp`;

/** After smoke-test home: buy three wolf pelts at the merchant, then turn them in for a brass ring. */
export const quest005CWolfPeltTribute = createQuestDefinition({
  id: 'quest-005-c-wolf-pelt-tribute',
  title: 'Three pelts',
  briefing: 'Someone on the road wants three wolf pelts from the forest merchant.',
  createdAt: 13,
  startStepId: 'tribute-intro',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-005-b-home'],
  }),
  journalSummaryFallback: 'Delivered three wolf pelts and took a brass ring in thanks.',
  steps: [
    {
      id: 'tribute-intro',
      type: 'choice',
      text:
        'A folded scrap is pinned to a trail-marker with a bent nail: three wolf pelts, from the forest merchant’s table—nothing less. Whoever left it is gone, but the debt reads clear. You can almost smell the tannery smoke from here.',
      visuals: [{ kind: 'image', src: CARD_IMG, alt: 'Forest path' }],
      choices: [
        {
          id: 'tribute-leave',
          label: 'Head to the merchant—I’ll come back.',
          effects: { clearActiveQuest: true },
        },
        {
          id: 'tribute-turn-in',
          label: 'Hand over three wolf pelts.',
          completeQuest: true,
          disabledUnlessModifiersAtLeast: { 'item:wolf-pelt': 3 },
          disabledLabel: ' (need 3 from the merchant)',
          effects: {
            modifiersDelta: {
              'item:wolf-pelt': -3,
              'item:brass-ring': 1,
            },
            questItemsAdd: ['A brass ring'],
          },
        },
      ],
    },
  ],
});
