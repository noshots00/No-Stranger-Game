import { TROLLEY_DAILY_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest017IronwoodSwitch = createBranchingQuest({
  id: 'quest-017-ironwood-switch',
  title: 'The Ironwood Switch',
  briefing: 'A runaway ore-cart and a lever you did not ask to hold.',
  createdAt: 18,
  startStepId: 'ironwood-intro',
  availability: { requiresAnyFlags: [TROLLEY_DAILY_FLAG] },
  steps: [
    {
      id: 'ironwood-intro',
      type: 'choice',
      text: 'A loaded ironwood cart screams down the ridge rails. Five rope-bound porters strain against the ties ahead. A side rail forks left to a single bound elder. Your hand is already on the switch lever.',
      choices: [
        {
          id: 'ironwood-pull-lever',
          label: 'Throw the lever — divert the cart onto the elder',
          nextStepId: 'ironwood-outcome-lever',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              AtlantiansRace: 1,
              DwarfRace: 1,
              StrengthStat: 1,
              CourageTrait: 1,
              Resolute: 1,
              BashSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} threw the switch — the cart hissed onto the side rail.'],
        },
        {
          id: 'ironwood-stand-still',
          label: 'Stand still — refuse to choose for the elder',
          nextStepId: 'ironwood-outcome-still',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              MageClass: 1,
              HighElfRace: 1,
              RiverKingdomRace: 1,
              IntelligenceStat: 1,
              CautiousTrait: 1,
              Haunted: 1,
            },
          },
          worldEventLogAdd: ['{playerName} let the lever lie — the cart kept its straight rail.'],
        },
        {
          id: 'ironwood-dive-ropes',
          label: 'Shout warning and dive at the ropes',
          nextStepId: 'ironwood-outcome-dive',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              RangerClass: 1,
              WoodElfRace: 1,
              CatfolkRace: 1,
              DexterityStat: 1,
              CourageTrait: 1,
              SurvivalSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} sprinted at the ties, knife already drawn.'],
        },
        {
          id: 'ironwood-brace-wedge',
          label: 'Run beside the cart and brace your body in the wheel-wedge',
          nextStepId: 'ironwood-outcome-brace',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              SunbornRace: 1,
              TrollRace: 1,
              ConstitutionStat: 1,
              CourageTrait: 1,
              Selfless: 1,
              HealingSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} threw their shoulder into the wedge as the cart bore down.'],
        },
      ],
    },
    {
      id: 'ironwood-outcome-lever',
      type: 'message',
      text: 'Iron clangs. The five porters sag against their ties, sobbing. The elder does not. The lever is cool against your palm — the only cool thing for a long while.',
      completeQuest: true,
    },
    {
      id: 'ironwood-outcome-still',
      type: 'message',
      text: 'You stand exactly where you stood. The cart finds the porters. Your hand is still on the lever. You did not move it. You will tell yourself that for years.',
      completeQuest: true,
    },
    {
      id: 'ironwood-outcome-dive',
      type: 'message',
      text: 'Three ties part under your blade before the cart arrives. Two porters tumble clear. The cart takes the rest. Your hands shake as if they cannot decide whether to be proud.',
      completeQuest: true,
    },
    {
      id: 'ironwood-outcome-brace',
      type: 'message',
      text: 'Wood splinters; your shoulder turns red and useless. The cart slows enough — barely enough. The porters live. You will remember which side of you cannot lift again.',
      completeQuest: true,
    },
  ],
});
