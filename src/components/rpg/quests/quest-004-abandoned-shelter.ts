import type { QuestDefinition } from './types';

export const quest004AbandonedShelter: QuestDefinition = {
  id: 'quest-004-abandoned-shelter',
  title: 'Abandoned Shelter',
  briefing:
    'A collapsed lean-to in the brush. Something—or someone—left supplies behind. Explore carefully; your approach shapes what you find.',
  createdAt: 4,
  startStepId: 'shelter-intro',
  isAvailable: (context) => context.explorationLevel >= 2,
  steps: {
    'shelter-intro': {
      id: 'shelter-intro',
      type: 'choice',
      text: "You've been wandering all night... drop dead tired. You stumble upon an abandoned shelter.",
      choices: [
        {
          id: 'shelter-crawl',
          label: 'Crawl Inside',
          nextStepId: 'shelter-loot',
          effects: {
            modifiersDelta: { MageClass: 1, Scoundrel: 1 },
          },
        },
        {
          id: 'shelter-shout',
          label: "Shout out 'Is there anyone in there?'",
          nextStepId: 'shelter-shout-bridge',
          effects: {
            modifiersDelta: { WarriorClass: 1, Leader: 1 },
          },
        },
      ],
    },
    'shelter-shout-bridge': {
      id: 'shelter-shout-bridge',
      type: 'choice',
      text: 'The only sounds you hear are crickets and birds. Satisfied, you enter the shelter.',
      choices: [
        {
          id: 'shelter-shout-continue',
          label: 'Continue',
          nextStepId: 'shelter-loot',
        },
      ],
    },
    'shelter-loot': {
      id: 'shelter-loot',
      type: 'choice',
      text: 'You collapse onto a bedroll in the corner. Your ribs hit something hard. You reach down and pull out a strange object.',
      choices: [
        {
          id: 'shelter-loot-buckler',
          label: "It's a tiny buckler.",
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ["It's a tiny buckler."],
          },
        },
        {
          id: 'shelter-loot-dagger',
          label: "It's an old parrying dagger.",
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ["It's an old parrying dagger."],
          },
        },
        {
          id: 'shelter-loot-book',
          label: 'An old book with a strange symbol on the cover.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['An old book with a strange symbol on the cover.'],
          },
        },
      ],
    },
  },
};
