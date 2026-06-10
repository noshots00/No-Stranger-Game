import {
  OLD_WELL_LOCATION,
  QUEST_002B_WELL_COIN_FLAG,
  QUEST_002B_WELL_OPENED_FLAG,
  QUEST_002B_THROWN_LABEL_PREFIX,
  QUEST_002B_WELL_THREW_FLAG,
  QUEST_SUNSET_ID,
} from '../constants';
import { makeQuestAvailability, makeQuestUnveilEligibility } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const BATCH = 'art/converted';
const WELL_IMG = `${BATCH}/forest-gnome-drinking-from-pond.webp`;

const WELL_DESCRIPTION =
  'A ray of light shines through the usual dense canopy upon an ancient well.';

const WELL_AVAILABILITY = {
  requiresAnyCompletedQuestIds: [QUEST_SUNSET_ID],
  requiresLocation: OLD_WELL_LOCATION,
};

/** Forest beat after first night — Door-style NPC popup at Old Well (travel to play). */
export const quest002BWillIStarve = createQuestDefinition({
  id: 'quest-002-b-will-i-starve',
  title: 'The Old Well',
  briefing:
    'You discovered The Old Well!  You can revisit locations you have discovered.',
  createdAt: 2,
  locationPopup: true,
  locationRepeats: true,
  locationGated: true,
  questCardInteractive: false,
  requiredPlayLocation: OLD_WELL_LOCATION,
  startStepId: 'well-halt',
  isAvailable: makeQuestAvailability(WELL_AVAILABILITY),
  isUnveilEligible: makeQuestUnveilEligibility(WELL_AVAILABILITY),
  journalSummaryFallback: 'You visited an ancient well in the forest.',
  steps: [
    {
      id: 'well-halt',
      type: 'message',
      text: WELL_DESCRIPTION,
      visuals: [{ kind: 'image', src: WELL_IMG, alt: 'The Old Well' }],
      nextStepId: 'well-hub',
    },
    {
      id: 'well-hub',
      type: 'choice',
      text: '',
      choices: [
        {
          id: 'q2-well-turn-water',
          label: 'Turn the handle',
          nextStepId: 'well-turn-water',
          disabledIfAnyFlags: [QUEST_002B_WELL_THREW_FLAG],
          disabledLabel: ' (something is already in the well)',
        },
        {
          id: 'q2-well-turn-coin',
          label: 'Turn the handle',
          nextStepId: 'well-turn-coin',
          enabledIfAnyFlags: [QUEST_002B_WELL_THREW_FLAG],
          disabledIfAnyFlags: [QUEST_002B_WELL_COIN_FLAG],
          disabledLabel: ' (coin already retrieved)',
          effects: {
            flagsSet: [QUEST_002B_WELL_COIN_FLAG],
            questItemsAdd: ['Strange coin'],
          },
        },
        {
          id: 'q2-well-throw',
          label: 'Throw something in',
          nextStepId: 'well-throw-pick',
        },
        {
          id: 'q2-well-leave',
          label: 'Leave for now... (you can return to places on your map)',
          completeQuest: true,
          effects: {
            flagsSet: [QUEST_002B_WELL_OPENED_FLAG],
          },
        },
      ],
    },
    {
      id: 'well-turn-water',
      type: 'message',
      text: 'A bucket full of water comes up.',
      nextStepId: 'well-hub',
    },
    {
      id: 'well-turn-coin',
      type: 'message',
      text: "There's a strange coin in the bucket.",
      nextStepId: 'well-hub',
    },
    {
      id: 'well-throw-pick',
      type: 'inventoryPick',
      text: 'Choose something from your pack to drop into the well.',
      submitLabel: 'Throw it in',
      nextStepId: 'well-throw-done',
      emptyText: 'You have nothing to throw in.',
      thrownItemFlagPrefix: QUEST_002B_THROWN_LABEL_PREFIX,
      effects: {
        flagsSet: [QUEST_002B_WELL_THREW_FLAG],
      },
    },
    {
      id: 'well-throw-done',
      type: 'message',
      text: 'You threw a {thrownItem} into the well.',
      nextStepId: 'well-hub',
    },
  ],
});
