import { SILVER_LAKE_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

/** First visit / tracked quest: unlocks Silver Lake on the map and sets `silver-lake-unlocked`. */
export const quest003SilverLake = createBranchingQuest({
  id: 'quest-003-silver-lake',
  title: 'Silver Lake',
  briefing: 'A still sheet of water beyond the pines—cold, deep, and quiet.',
  createdAt: 3,
  startStepId: 'sl3-1',
  availability: {
    minExplorationLevel: 4,
  },
  steps: [
    {
      id: 'sl3-1',
      type: 'choice',
      text: 'The water on the lake is still as glass.',
      choices: [
        {
          id: 'sl3-leave',
          label: 'Leave for now',
          completeQuest: true,
          effects: {
            flagsSet: [SILVER_LAKE_FLAG],
            modifiersDelta: {
              HalflingRace: 1,
              River_KingdomRace: 1,
              AtlantiansRace: 1,
            },
          },
        },
        {
          id: 'sl3-feel',
          label: 'Feel the water.',
          nextStepId: 'sl3-2',
          effects: {
            flagsSet: [SILVER_LAKE_FLAG],
            modifiersDelta: {
              AtlantiansRace: 1,
              SunbornRace: 1,
              WoodElfRace: 1,
              NightElfRace: 1,
            },
          },
        },
      ],
    },
    {
      id: 'sl3-2',
      type: 'message',
      text: 'The water is colder than you expected.',
      completeQuest: true,
    },
  ],
});
