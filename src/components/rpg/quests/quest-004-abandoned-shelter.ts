import type { QuestDefinition } from './types';

export const quest004AbandonedShelter: QuestDefinition = {
  id: 'quest-004-abandoned-shelter',
  title: 'Abandoned Shelter',
  briefing:
    'A collapsed lean-to in the brush. Something—or someone—left supplies behind. Explore carefully; your approach shapes what you find.',
  createdAt: 7,
  startStepId: 'shelter-intro',
  isAvailable: (context) =>
    (context.completedQuestIds.includes('quest-001-origin') || context.flags.includes('quest001-complete')) &&
    context.currentDay >= 3,
  steps: {
    'shelter-intro': {
      id: 'shelter-intro',
      type: 'choice',
      text: "You've been wandering all night... drop dead tired. You stumble upon an abandoned shelter.",
      choices: [
        {
          id: 'shelter-crawl',
          label: 'At least Ill have somewhere to sleep.',
          nextStepId: 'shelter-loot',
          effects: {
            modifiersDelta: {
              MageClass: 1,
              Scoundrel: 1,
              GnomeRace: 1,
              GoblinRace: 1,
              HalflingRace: 1,
              NightElfRace: 1,
            },
          },
        },
        {
          id: 'shelter-shout',
          label: "Shout out 'Is there anyone in there?'",
          nextStepId: 'shelter-shout-bridge',
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              Leader: 1,
              OrcRace: 1,
              DwarfRace: 1,
              AtlantiansRace: 1,
              CatfolkRace: 1,
            },
          },
        },
      ],
    },
    'shelter-shout-bridge': {
      id: 'shelter-shout-bridge',
      type: 'choice',
      text: 'The only sounds you hear are crickets and birds. Satisfied, you enter the shelter.',
      choices: [
        {
          id: 'shelter-shout-continue',
          label: 'Continue',
          nextStepId: 'shelter-loot',
        },
      ],
    },
    'shelter-loot': {
      id: 'shelter-loot',
      type: 'choice',
      text: 'You collapse onto a bedroll in the corner. Your ribs hit something hard. You reach down and pull out a strange object.',
      choices: [
        {
          id: 'shelter-loot-buckler',
          label: "It's a tiny buckler.",
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ["It's a tiny buckler."],
            modifiersDelta: {
              DwarfRace: 1,
              AtlantiansRace: 1,
              OrcRace: 1,
            },
          },
        },
        {
          id: 'shelter-loot-dagger',
          label: "It's an old parrying dagger.",
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ["It's an old parrying dagger."],
            modifiersDelta: {
              WoodElfRace: 1,
              NightElfRace: 1,
              GoblinRace: 1,
              HighElfRace: 1,
            },
          },
        },
        {
          id: 'shelter-loot-book',
          label: 'An old book with a strange symbol on the cover.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['An old book with a strange symbol on the cover.'],
            modifiersDelta: {
              HighElfRace: 1,
              RiverKingdomRace: 1,
              GnomeRace: 1,
              SunbornRace: 1,
            },
          },
        },
        {
          id: 'shelter-loot-placeholder-1',
          label: 'A small silver cross on a worn cord.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A small silver cross on a worn cord.'],
            modifiersDelta: {
              GoblinRace: 1,
              HalflingRace: 1,
              GnomeRace: 1,
            },
          },
        },
        {
          id: 'shelter-loot-placeholder-2',
          label: 'An exotic arrow with iridescent fletching.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['An exotic arrow with iridescent fletching.'],
            modifiersDelta: {
              DwarfRace: 1,
              TrollRace: 1,
              OrcRace: 1,
            },
          },
        },
        {
          id: 'shelter-loot-placeholder-3',
          label: 'A copper signet ring, sigil worn smooth.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A copper signet ring, sigil worn smooth.'],
            modifiersDelta: {
              WoodElfRace: 1,
              CatfolkRace: 1,
              NightElfRace: 1,
            },
          },
        },
        {
          id: 'shelter-loot-placeholder-4',
          label: 'A bone-handled fishing knife.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A bone-handled fishing knife.'],
            modifiersDelta: {
              RiverKingdomRace: 1,
              SunbornRace: 1,
              AtlantiansRace: 1,
            },
          },
        },
        {
          id: 'shelter-loot-placeholder-5',
          label: 'A folded scrap of map, ink-faded at the edges.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A folded scrap of map, ink-faded at the edges.'],
            modifiersDelta: {
              HighElfRace: 1,
              HalflingRace: 1,
              GnomeRace: 1,
            },
          },
        },
      ],
    },
  },
};
