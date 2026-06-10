import { QUEST_FIRST_NIGHT_ID } from '../constants';
import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

/** Tutorial — player equips weapon/gear and a skill on the Character tab. */
export const quest002DEquipLoadout = createQuestDefinition({
  id: 'quest-002-d-equip-loadout',
  title: 'Equip a weapon and a skill',
  briefing: 'Open Character and fill your loadout.',
  createdAt: 2,
  startStepId: 'start',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: [QUEST_FIRST_NIGHT_ID],
  }),
  journalSummaryFallback: 'You equipped a weapon and a skill.',
  steps: [
    {
      id: 'start',
      type: 'choice',
      text: 'Before you venture further, set up your combat loadout.',
      choices: [
        {
          id: 'equip-continue',
          label: 'Continue',
          nextStepId: 'await-loadout',
        },
      ],
    },
    {
      id: 'await-loadout',
      type: 'message',
      text:
        'Use the Nav Bar at the bottom of the screen to go to the character screen. Then, use the loadout bar to equip a weapon and a skill.',
    },
  ],
});
