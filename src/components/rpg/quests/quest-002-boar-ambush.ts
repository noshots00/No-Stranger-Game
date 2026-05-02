import type { QuestDefinition } from './types';

export const quest002BoarAmbush: QuestDefinition = {
  id: 'quest-002-boar-ambush',
  title: 'Boar in the Brush',
  briefing: 'A wild boar charges from the treeline. Your instinct defines your path.',
  createdAt: 2,
  startStepId: 'boar-attack',
  isAvailable: (context) => context.explorationLevel >= 2 && context.currentDay >= 2,
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
            modifiersDelta: {
              WarriorClass: 1,
              Strength: 1,
              OrcRace: 1,
              DwarfRace: 1,
              AtlantiansRace: 1,
            },
            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-cast-spell',
          label: 'cast a spell',
          nextStepId: 'boar-outcome',
          effects: {
            modifiersDelta: {
              MageClass: 1,
              Intelligence: 1,
              HighElfRace: 1,
              GnomeRace: 1,
              RiverKingdomRace: 1,
            },
            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-try-dodge',
          label: 'try to dodge',
          nextStepId: 'boar-outcome',
          effects: {
            modifiersDelta: {
              RogueClass: 1,
              Evasion: 1,
              Dodge: 1,
              HalflingRace: 1,
              GoblinRace: 1,
              WoodElfRace: 1,
              CatfolkRace: 1,
            },
            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-run-away',
          label: 'run away',
          nextStepId: 'boar-outcome',
          effects: {
            modifiersDelta: {
              Coward: 1,
              FastFeet: 1,
              SurvivalInstinct: 1,
              GoblinRace: 1,
              HalflingRace: 1,
              RiverKingdomRace: 1,
            },
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
