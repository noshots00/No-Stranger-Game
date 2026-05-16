import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

export const quest002BWillIStarve = createQuestDefinition({
  id: 'quest-002-b-will-i-starve',
  title: 'Will I Starve?',
  briefing: '... alone in this forest?',
  createdAt: 2,
  startStepId: 'starve-intro',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-002-first-night'],
  }),
  journalSummaryFallback: 'Will I Starve?',
  steps: [
    {
      id: 'starve-intro',
      type: 'choice',
      text:
        'Your stomach twists. The forest is beautiful, but beauty is not food. You realize you have no idea what is safe to eat here.',
      worldEventLogAfterChoice: ['{playerName} wondered if they would starve alone in the forest.'],
      choices: [
        {
          id: 'starve-search-food',
          label: 'Search the forest for something edible',
          nextStepId: 'starve-search-aftermath',
          effects: {
            flagsSet: ['quest-002-b-foraging-started'],
            modifiersDelta: {
              SurvivalInstinct: 1,
              ForagingSkill: 1,
              HalflingRace: 1,
              WoodElfRace: 1,
              GnomeRace: 1,
            },
          },
        },
        {
          id: 'starve-wait',
          label: 'Stay put and save your strength',
          completeQuest: true,
          effects: {
            flagsSet: ['quest-002-b-foraging-started'],
            modifiersDelta: {
              PatienceTrait: 1,
              SurvivalInstinct: 1,
              DwarfRace: 1,
              RiverKingdomRace: 1,
              CatfolkRace: 1,
            },
          },
        },
      ],
    },
    {
      id: 'starve-search-aftermath',
      type: 'message',
      text:
        '{playerName} searches beneath the trees, finding more questions than answers, but also the first hints of what might keep someone alive here.',
      completeQuest: true,
    },
  ],
});
