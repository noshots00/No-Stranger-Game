import { SOPHIE_DAILY_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest022WarlordsChoice = createBranchingQuest({
  id: 'quest-022-warlords-choice',
  title: "The Warlord's Choice",
  briefing: 'Two children on their knees. One blade. The wrong question.',
  createdAt: 22,
  startStepId: 'warlord-intro',
  availability: { requiresAnyFlags: [SOPHIE_DAILY_FLAG] },
  steps: [
    {
      id: 'warlord-intro',
      type: 'choice',
      text: 'A dark warlord pins you in the village holdfast. Two captive children — your neighbour\'s twins, a girl and a boy, ten years old apiece — kneel side by side on the flagstones. He sets the point of his blade between them. "Choose one. Refuse, and both go." His eyes do not blink.',
      choices: [
        {
          id: 'warlord-pick-daughter',
          label: 'Choose the daughter — let her live',
          nextStepId: 'warlord-outcome-daughter',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              AtlantiansRace: 1,
              DwarfRace: 1,
              CharismaStat: 1,
              CourageTrait: 1,
              Haunted: 1,
            },
          },
          worldEventLogAdd: ['{playerName} pointed once, at the daughter, and could not look at the son.'],
        },
        {
          id: 'warlord-pick-son',
          label: 'Choose the son — let him live',
          nextStepId: 'warlord-outcome-son',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              OrcRace: 1,
              SunbornRace: 1,
              StrengthStat: 1,
              CourageTrait: 1,
              Haunted: 1,
            },
          },
          worldEventLogAdd: ['{playerName} pointed once, at the son, and could not look at the daughter.'],
        },
        {
          id: 'warlord-refuse',
          label: 'Refuse — both die. You live to bear the weight',
          nextStepId: 'warlord-outcome-refuse',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              MageClass: 1,
              RiverKingdomRace: 1,
              NightElfRace: 1,
              CatfolkRace: 1,
              IntelligenceStat: 1,
              CowardTrait: 1,
              Haunted: 1,
            },
          },
          worldEventLogAdd: ['{playerName} closed their mouth and would not name either child.'],
        },
        {
          id: 'warlord-sacrifice',
          label: 'Step in front of the warlord\'s blade — offer yourself instead',
          nextStepId: 'warlord-outcome-sacrifice',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              SunbornRace: 1,
              TrollRace: 1,
              ConstitutionStat: 1,
              CourageTrait: 1,
              Resolute: 1,
              HealingSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} stepped between the warlord and the children, hands open.'],
        },
      ],
    },
    {
      id: 'warlord-outcome-daughter',
      type: 'message',
      text: 'The blade falls. The girl is led out, alive. She does not speak to you on the way past — she does not yet know whether to. You will live, you suspect, in the corner of her eye.',
      completeQuest: true,
    },
    {
      id: 'warlord-outcome-son',
      type: 'message',
      text: 'The blade falls. The boy is led out, alive. He looks at you once over his shoulder, the look of a child trying to be a man. You will see that look in mirrors for years.',
      completeQuest: true,
    },
    {
      id: 'warlord-outcome-refuse',
      type: 'message',
      text: 'You say nothing. The warlord does what he said he would do. He lets you walk out into the lane to carry the news. You carry it the rest of your days.',
      completeQuest: true,
    },
    {
      id: 'warlord-outcome-sacrifice',
      type: 'message',
      text: 'The warlord laughs once — not a kind laugh — and takes the offer. The blade is fast. The twins are returned to the village before nightfall, and a name on a stone is added to the chapel wall.',
      completeQuest: true,
    },
  ],
});
