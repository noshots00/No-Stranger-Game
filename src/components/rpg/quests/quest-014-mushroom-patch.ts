import {
  FEVER_DREAM_PENDING_FLAG,
  SWEET_DREAM_PENDING_FLAG,
} from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest014MushroomPatch = createBranchingQuest({
  id: 'quest-014-mushroom-patch',
  title: 'Mushroom Patch',
  briefing: 'Something colorful peeks from the leaf litter.',
  createdAt: 15,
  startStepId: 'mushroom-intro',
  availability: {
    requiresAnyCompletedQuestIds: ['quest-001-origin'],
    requiresAnyFlags: ['quest001-complete'],
    minDay: 2,
  },
  steps: [
    {
      id: 'mushroom-intro',
      type: 'choice',
      text: 'You stumble upon a patch of mushrooms.',
      choices: [
        { id: 'mushroom-intro-taste', label: 'Taste one', nextStepId: 'mushroom-taste' },
        {
          id: 'mushroom-leave',
          label: 'Leave',
          nextStepId: 'mushroom-leave-outcome',
          completeQuest: true,
          effects: {
            flagsSet: [SWEET_DREAM_PENDING_FLAG],
            modifiersDelta: {
              RiverKingdomRace: 1,
              RangerClass: 1,
              Wisdom: 1,
              GroundedSpiritBlessing: 1,
              CautiousTrait: 1,
              Survival_MycologySkill: 1,
            },
          },
        },
      ],
    },
    {
      id: 'mushroom-taste',
      type: 'choice',
      text: "It's earthy and slightly sweet",
      choices: [
        {
          id: 'mushroom-eat-more',
          label: 'Eat more',
          nextStepId: 'mushroom-taste-outcome',
          completeQuest: true,
          effects: {
            flagsSet: [FEVER_DREAM_PENDING_FLAG],
            modifiersDelta: {
              NightElfRace: 1,
              MageClass: 1,
              Constitution: 1,
              
              Food_LoverCharacteristic: 1,
              
            },
          },
        },
        {
          id: 'mushroom-enough',
          label: "That's enough",
          nextStepId: 'mushroom-taste-outcome',
          completeQuest: true,
          effects: {
            flagsSet: [FEVER_DREAM_PENDING_FLAG],
            modifiersDelta: {
              HalflingRace: 1,
              RangerClass: 1,
              Charisma: 1,
              TemperanceTrait: 1,
              HerbalismSkill : 1,
            },
          },
        },
      ],
    },
    {
      id: 'mushroom-taste-outcome',
      type: 'message',
      text: 'You walk away from the mushroom patch.',
      completeQuest: true,
    },
    {
      id: 'mushroom-leave-outcome',
      type: 'message',
      text: 'You left the mushroom patch alone.',
      completeQuest: true,
    },
  ],
});
