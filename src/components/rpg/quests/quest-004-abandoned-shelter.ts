import { QUEST_DYERS_CRYPT_ID } from '../constants';
import { makeQuestUnveilEligibility, meetsMinDay } from './branching-quest-template';
import type { QuestDefinition } from './types';

const ABANDONED_SHELTER_ART = 'art/converted/a-hut-richard-bergholz.webp';

const shelterVisual = {
  kind: 'image' as const,
  src: ABANDONED_SHELTER_ART,
  alt: 'An abandoned hut in the woods',
};

/** Merged into Dyer's Crypt; kept for legacy saves. */
const LEGACY_WANDERING_SKELETON_QUEST_ID = 'quest-006-wandering-skeleton';

export const quest004AbandonedShelter: QuestDefinition = {
  id: 'quest-004-abandoned-shelter',
  title: 'Abandoned Shelter',
  briefing:
    'A collapsed lean-to in the brush. Something—or someone—left supplies behind. Explore carefully; your approach shapes what you find.',
  createdAt: 7,
  startStepId: 'shelter-intro',
  isAvailable: (context) =>
    (context.completedQuestIds.includes(QUEST_DYERS_CRYPT_ID) ||
      context.completedQuestIds.includes(LEGACY_WANDERING_SKELETON_QUEST_ID)) &&
    meetsMinDay(context, 2),
  isUnveilEligible: makeQuestUnveilEligibility({
    requiresAnyCompletedQuestIds: [QUEST_DYERS_CRYPT_ID, LEGACY_WANDERING_SKELETON_QUEST_ID],
  }),
  stepVisuals: {
    'shelter-intro': [shelterVisual],
    'shelter-shout-bridge': [shelterVisual],
    'shelter-loot': [shelterVisual],
  },
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

          },
        },
        {
          id: 'shelter-shout',
          label: "Shout out 'Is there anyone in there?'",
          nextStepId: 'shelter-shout-bridge',
          effects: {

          },
        },
      ],
    },
    'shelter-shout-bridge': {
      id: 'shelter-shout-bridge',
      type: 'message',
      text: 'The only sounds you hear are crickets and birds. Satisfied, you enter the shelter.',
      nextStepId: 'shelter-loot',
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

          },
        },
        {
          id: 'shelter-loot-dagger',
          label: "It's an old parrying dagger.",
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ["It's an old parrying dagger."],

          },
        },
        {
          id: 'shelter-loot-book',
          label: 'An old book with a strange symbol on the cover.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['An old book with a strange symbol on the cover.'],

          },
        },
        {
          id: 'shelter-loot-placeholder-1',
          label: 'A small silver cross on a worn cord.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A small silver cross on a worn cord.'],

          },
        },
        {
          id: 'shelter-loot-placeholder-2',
          label: 'An exotic arrow with iridescent fletching.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['An exotic arrow with iridescent fletching.'],

          },
        },
        {
          id: 'shelter-loot-placeholder-3',
          label: 'A copper signet ring, sigil worn smooth.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A copper signet ring, sigil worn smooth.'],

          },
        },
        {
          id: 'shelter-loot-placeholder-4',
          label: 'A bone-handled fishing knife.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A bone-handled fishing knife.'],

          },
        },
        {
          id: 'shelter-loot-placeholder-5',
          label: 'A folded scrap of map, ink-faded at the edges.',
          completeQuest: true,
          effects: {
            flagsSet: ['abandoned-shelter-complete'],
            questItemsAdd: ['A folded scrap of map, ink-faded at the edges.'],

          },
        },
      ],
    },
  },
};
