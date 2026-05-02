import { createBranchingQuest } from './branching-quest-template';

type FindItemQuestOptions = {
  id: string;
  title: string;
  createdAt: number;
  itemName: string;
  activationFlag: string;
};

const leaveItemNoun = (itemName: string) => itemName.replace(/^(a|an)\s+/i, '').trim();

export function createFindItemQuest(options: FindItemQuestOptions) {
  return createBranchingQuest({
    id: options.id,
    title: options.title,
    briefing: `A small discovery: ${options.itemName}.`,
    createdAt: options.createdAt,
    startStepId: `${options.id}-intro`,
    availability: {
      requiresAnyFlags: [options.activationFlag],
    },
    steps: [
      {
        id: `${options.id}-intro`,
        type: 'choice',
        text: `You found ${options.itemName}.`,
        choices: [
          {
            id: `${options.id}-pick-up`,
            label: 'pick it up',
            completeQuest: true,
            effects: {
              questItemsAdd: [options.itemName],
            },
            worldEventLogAdd: [`{playerName} found ${options.itemName}.`],
          },
          {
            id: `${options.id}-leave-it`,
            label: 'leave it',
            completeQuest: true,
            worldEventLogAdd: [`{playerName} left the ${leaveItemNoun(options.itemName)}.`],
          },
        ],
      },
    ],
  });
}
