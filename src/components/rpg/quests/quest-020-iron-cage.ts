import { PRISONER_DAILY_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest020IronCage = createBranchingQuest({
  id: 'quest-020-iron-cage',
  title: 'The Iron Cage',
  briefing: 'Two cages, one magistrate, one offer.',
  createdAt: 20,
  startStepId: 'iron-cage-intro',
  availability: { requiresAnyFlags: [PRISONER_DAILY_FLAG] },
  steps: [
    {
      id: 'iron-cage-intro',
      type: 'choice',
      text: 'You and a fellow forager were taken at the tree-line. Two iron cages face each other across the magistrate\'s hall. He stands between, palms open. "Speak, and walk free. Stay silent and your friend speaks first." What do you say?',
      choices: [
        {
          id: 'iron-cage-silent',
          label: 'Stay silent — trust your partner',
          nextStepId: 'iron-cage-outcome-silent',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              SunbornRace: 1,
              AtlantiansRace: 1,
              WisdomStat: 1,
              CourageTrait: 1,
              Resolute: 1,
            },
          },
          worldEventLogAdd: ['{playerName} kept their tongue and listened to the bars settle.'],
        },
        {
          id: 'iron-cage-accuse',
          label: 'Accuse your partner of everything',
          nextStepId: 'iron-cage-outcome-accuse',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              RogueClass: 1,
              GoblinRace: 1,
              CharismaStat: 1,
              CowardTrait: 1,
              Paranoid: 1,
            },
          },
          worldEventLogAdd: ['{playerName} laid every charge at the other cage and asked for the door.'],
        },
        {
          id: 'iron-cage-confess',
          label: 'Confess to your share — name no one else',
          nextStepId: 'iron-cage-outcome-confess',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              DwarfRace: 1,
              HalflingRace: 1,
              WisdomStat: 1,
              TemperanceTrait: 1,
              Resolute: 1,
            },
          },
          worldEventLogAdd: ['{playerName} owned their part of it and only their part of it.'],
        },
        {
          id: 'iron-cage-deflect',
          label: 'Lie about a third forager who was never there',
          nextStepId: 'iron-cage-outcome-deflect',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              MageClass: 1,
              GnomeRace: 1,
              NightElfRace: 1,
              IntelligenceStat: 1,
              CautiousTrait: 1,
              Paranoid: 1,
              IllusionSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} invented a stranger and watched the magistrate write the name down.'],
        },
      ],
    },
    {
      id: 'iron-cage-outcome-silent',
      type: 'message',
      text: 'Hours pass. The other cage stays silent too. The magistrate finally lets you both out — half-sentences, mended together. You walk out shoulder to shoulder; neither of you speaks of it for a long time.',
      completeQuest: true,
    },
    {
      id: 'iron-cage-outcome-accuse',
      type: 'message',
      text: 'You step into the lane a free man before nightfall. The other cage is locked behind you. You do not look back. You will need to choose, often, not to look back.',
      completeQuest: true,
    },
    {
      id: 'iron-cage-outcome-confess',
      type: 'message',
      text: 'Your sentence is light; your friend\'s, lighter still. The magistrate watches you leave with something close to respect. The cage door rings shut behind your shoulder, but only for a season.',
      completeQuest: true,
    },
    {
      id: 'iron-cage-outcome-deflect',
      type: 'message',
      text: 'The magistrate hunts a stranger who was never there. You walk free; so does your partner. Somewhere a name you invented earns a price. You sleep with the door barred for a while.',
      completeQuest: true,
    },
  ],
});
