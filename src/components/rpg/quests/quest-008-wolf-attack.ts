import { createBranchingQuest } from './branching-quest-template';
import { WOLF_ATTACK_DAILY_FLAG } from '../constants';

export const quest008WolfAttack = createBranchingQuest({
  id: 'quest-008-wolf-attack',
  title: 'Wolf Attack',
  briefing: 'You were attacked by a wolf. What happened?',
  createdAt: 9,
  startStepId: 'wolf-attack-intro',
  availability: {
    requiresAnyFlags: [WOLF_ATTACK_DAILY_FLAG],
  },
  steps: [
    {
      id: 'wolf-attack-intro',
      type: 'choice',
      text: 'You were attacked by a wolf. What happened?',
      choices: [
        {
          id: 'wolf-attack-a',
          label: 'You fought it off with your bare hands',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              CourageTrait: 1,
              BashSkill: 1,
              WarriorClass: 1,
              AttackSkill: 1,
              OrcRace: 1,
              DwarfRace: 1,
              TrollRace: 1,
            },
          },
        },
        {
          id: 'wolf-attack-b',
          label: 'You cast a spell',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              CourageTrait: 1,
              SparkSpell: 1,
              MageClass: 1,
              SpellcastingSkill: 1,
              HighElfRace: 1,
              SunbornRace: 1,
              GnomeRace: 1,
            },
          },
        },
        {
          id: 'wolf-attack-c',
          label: "You jammed a fork in the wolf's eye",
          completeQuest: true,
          effects: {
            modifiersDelta: {
              CourageTrait: 1,
              Critical_AttackSkill: 1,
              RogueClass: 1,
              AttackSkill: 1,
              GoblinRace: 1,
              HalflingRace: 1,
              NightElfRace: 1,
              CatfolkRace: 1,
            },
          },
        },
        {
          id: 'wolf-attack-d',
          label: "You ran away and the wolf didn't follow.",
          completeQuest: true,
          effects: {
            modifiersDelta: {
              CowardTrait: 1,
              RunningSkill: 1,
              SurvivalSkill: 1,
              GoblinRace: 1,
              HalflingRace: 1,
              WoodElfRace: 1,
            },
          },
        },
      ],
    },
  ],
});
