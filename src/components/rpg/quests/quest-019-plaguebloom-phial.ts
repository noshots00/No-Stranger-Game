import { HEINZ_DAILY_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest019PlaguebloomPhial = createBranchingQuest({
  id: 'quest-019-plaguebloom-phial',
  title: 'The Plaguebloom Phial',
  briefing: 'A wife dying of plaguebloom. An apothecary who will not relent.',
  createdAt: 19,
  startStepId: 'plague-intro',
  availability: { requiresAnyFlags: [HEINZ_DAILY_FLAG] },
  steps: [
    {
      id: 'plague-intro',
      type: 'choice',
      text: 'Your wife\'s fever climbs hour by hour. The apothecary on the lane sells the only known phial — for ten years\' wages. Lamps are being lit on the avenue. How do you approach?',
      choices: [
        {
          id: 'plague-approach-beg',
          label: 'Beg at the counter',
          nextStepId: 'plague-beg',
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              SunbornRace: 1,
              CharismaStat: 1,
              CautiousTrait: 1,
              Hopeful: 1,
            },
          },
          worldEventLogAdd: ['{playerName} walked in with empty hands and a low voice.'],
        },
        {
          id: 'plague-approach-demand',
          label: 'Demand the price be lowered',
          nextStepId: 'plague-demand',
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              OrcRace: 1,
              StrengthStat: 1,
              CourageTrait: 1,
              Resolute: 1,
            },
          },
          worldEventLogAdd: ['{playerName} kicked the door open and named a fairer price.'],
        },
        {
          id: 'plague-approach-slip',
          label: 'Slip in the back at dusk',
          nextStepId: 'plague-slip',
          effects: {
            modifiersDelta: {
              RogueClass: 1,
              GoblinRace: 1,
              CatfolkRace: 1,
              DexterityStat: 1,
              CautiousTrait: 1,
              StealthSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} circled the apothecary at last light and counted his shutters.'],
        },
      ],
    },
    {
      id: 'plague-beg',
      type: 'choice',
      text: 'Your forehead touches the counter. The apothecary watches without comment.',
      choices: [
        {
          id: 'plague-beg-pay',
          label: 'Tip every coin you own onto the counter',
          nextStepId: 'plague-outcome-pay',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              HalflingRace: 1,
              WisdomStat: 1,
              TemperanceTrait: 1,
              HealingSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} emptied their purse and held out the phial in trembling hands.'],
        },
        {
          id: 'plague-beg-pray',
          label: 'Walk home and pray over her instead',
          nextStepId: 'plague-outcome-pray',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              AtlantiansRace: 1,
              DwarfRace: 1,
              WisdomStat: 1,
              CourageTrait: 1,
              Hopeful: 1,
              HealingSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} returned empty-handed and knelt by the bedside instead.'],
        },
      ],
    },
    {
      id: 'plague-demand',
      type: 'choice',
      text: 'Your voice rattles the bottles on the shelf. The apothecary does not blink.',
      choices: [
        {
          id: 'plague-demand-strike',
          label: 'Strike him; take the phial',
          nextStepId: 'plague-outcome-strike',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              TrollRace: 1,
              OrcRace: 1,
              StrengthStat: 1,
              CourageTrait: 1,
              BashSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} cracked the apothecary across the jaw and pocketed the phial.'],
        },
        {
          id: 'plague-demand-walk',
          label: 'Walk away empty-handed',
          nextStepId: 'plague-outcome-walk',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              MageClass: 1,
              RiverKingdomRace: 1,
              IntelligenceStat: 1,
              CautiousTrait: 1,
              Haunted: 1,
            },
          },
          worldEventLogAdd: ['{playerName} turned at the threshold and walked back out into the dark.'],
        },
      ],
    },
    {
      id: 'plague-slip',
      type: 'choice',
      text: 'The lock gives soundlessly. The phial gleams on the apothecary\'s desk; the open ledger lies beside it.',
      choices: [
        {
          id: 'plague-slip-steal',
          label: 'Take the phial clean and leave',
          nextStepId: 'plague-outcome-steal',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              RogueClass: 1,
              NightElfRace: 1,
              CatfolkRace: 1,
              DexterityStat: 1,
              CowardTrait: 1,
              StealthSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} pocketed the phial and slipped back out the way they came.'],
        },
        {
          id: 'plague-slip-burn',
          label: 'Take the phial and burn the ledger so others can read the recipe',
          nextStepId: 'plague-outcome-burn',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              MageClass: 1,
              GnomeRace: 1,
              RiverKingdomRace: 1,
              IntelligenceStat: 1,
              CourageTrait: 1,
              Resolute: 1,
              ElementalSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} copied the recipe onto a slip, then put the ledger to the candle.'],
        },
      ],
    },
    {
      id: 'plague-outcome-pay',
      type: 'message',
      text: 'You walk home with a phial and not a coin. The fever breaks before sunrise. You will spend a year repaying the debt — and you will count the days as a man who chose right.',
      completeQuest: true,
    },
    {
      id: 'plague-outcome-pray',
      type: 'message',
      text: 'You hold her hand through the night. By dawn the fever has eased a fraction; whether your prayers reached anything is a question for cooler mornings. You did not steal. You did not strike. You stayed.',
      completeQuest: true,
    },
    {
      id: 'plague-outcome-strike',
      type: 'message',
      text: 'The phial works. The wardens come at midday. The apothecary will mend; you will not, not in the eyes of the avenue. Your wife coughs once and sleeps clean.',
      completeQuest: true,
    },
    {
      id: 'plague-outcome-walk',
      type: 'message',
      text: 'You walk a long route home. By the time you arrive she has slipped past speaking. You sit beside her. The lamp is steady; you are not.',
      completeQuest: true,
    },
    {
      id: 'plague-outcome-steal',
      type: 'message',
      text: 'You return through the alley before the lock is missed. By morning she is breathing easier; you are not. Every footstep on the lane sounds like a warden\'s.',
      completeQuest: true,
    },
    {
      id: 'plague-outcome-burn',
      type: 'message',
      text: 'The recipe is on three doorsteps before sunrise; the apothecary wakes to ash. Your wife mends. So does a stranger\'s child by the bridge, and another by the mill. You did not ask their names.',
      completeQuest: true,
    },
  ],
});
