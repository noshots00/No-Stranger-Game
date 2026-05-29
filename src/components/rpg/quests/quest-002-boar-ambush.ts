import { meetsMinDay } from './branching-quest-template';
import type { QuestDefinition } from './types';

export const quest002BoarAmbush: QuestDefinition = {
  id: 'quest-002-boar-ambush',
  title: 'Boar in the Brush',
  briefing: 'A wild boar charges from the treeline. Your instinct defines your path.',
  createdAt: 2,
  startStepId: 'boar-attack',
  isAvailable: (context) => context.explorationLevel >= 2 && meetsMinDay(context, 2),
  journalSummaryFallback: 'Boar in the Brush',
  steps: {
    'boar-attack': {
      id: 'boar-attack',
      type: 'choice',
      text: 'While exploring in the woods, you are suddenly attacked by a wild boar!',
      worldEventLogAfterChoice: ['You fended off a wild boar!'],
      choices: [
        {
          id: 'q2-strike-it',
          label: 'Strike it!',
          nextStepId: 'boar-outcome',
          effects: {

            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-cast-spell',
          label: 'cast a spell',
          nextStepId: 'boar-outcome',
          effects: {

            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-try-dodge',
          label: 'try to dodge',
          nextStepId: 'boar-outcome',
          effects: {

            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-run-away',
          label: 'run away',
          nextStepId: 'boar-outcome',
          effects: {

            flagsSet: ['quest002-complete'],
          },
        },
      ],
    },
    'boar-outcome': {
      id: 'boar-outcome',
      type: 'message',
      text: 'Good job!  The boar ran away and you are unharmed.',
      completeQuest: true,
    },
  },
};
