import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const BATCH = 'art/converted/batch-2026-05-02_21-10-35';
const DOOR_IMG = `${BATCH}/door-in-the-forest.webp`;
const CARL_PORTRAIT = `${BATCH}/atlantian-artist.webp`;

const FLAG_HEARD_DOOR = 'quest-004-b-heard-door';
const FLAG_HEARD_SELF = 'quest-004-b-heard-self';

/** After meeting the merchant: voice in the woods, then Carl behind a strange door. */
export const quest004BTheDoor = createQuestDefinition({
  id: 'quest-004-b-the-door',
  title: 'The Door',
  briefing: 'Something blocks the path—voice, wood, and patience.',
  createdAt: 11,
  startStepId: 'door-halt',
  questCardLayout: 'title-overlay',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-003-b-meet-merchant'],
  }),
  journalSummaryFallback: 'Answered the voice beyond the forest door.',
  steps: [
    {
      id: 'door-halt',
      type: 'choice',
      text:
        'The trail narrows. A great voice rolls through the trees—deep as distant thunder.\n\n“HALT, TRAVELER!”\n\nYou freeze.',
      visuals: [{ kind: 'image', src: DOOR_IMG, alt: 'A door in the forest' }],
      choices: [
        {
          id: 'door-continue',
          label: 'Continue...',
          nextStepId: 'carl-intro',
        },
      ],
    },
    {
      id: 'carl-intro',
      type: 'message',
      text:
        'Framed by old timber, a figure steps into the light—Carl, the self-styled ward of this threshold. “If you came this far,” he says, “you may speak. Choose your words.”',
      visuals: [{ kind: 'image', src: CARL_PORTRAIT, alt: 'Carl' }],
      nextStepId: 'carl-hub',
    },
    {
      id: 'carl-hub',
      type: 'choice',
      text: 'Carl waits, neither friendly nor cruel—only attentive.',
      visuals: [{ kind: 'image', src: CARL_PORTRAIT, alt: 'Carl' }],
      choices: [
        {
          id: 'carl-ask-door',
          label: 'Ask about the door',
          nextStepId: 'carl-door-msg',
          effects: { flagsSet: [FLAG_HEARD_DOOR] },
          disabledIfAnyFlags: [FLAG_HEARD_DOOR],
          disabledLabel: ' (already asked)',
        },
        {
          id: 'carl-ask-self',
          label: 'Ask who he is',
          nextStepId: 'carl-self-msg',
          effects: { flagsSet: [FLAG_HEARD_SELF] },
          disabledIfAnyFlags: [FLAG_HEARD_SELF],
          disabledLabel: ' (already asked)',
        },
        {
          id: 'carl-farewell',
          label: 'Farewell',
          completeQuest: true,
        },
      ],
    },
    {
      id: 'carl-door-msg',
      type: 'message',
      text:
        'Carl rests a palm on the wood. “This door goes where you are ready to go—not a step sooner. Treat it as a question, not a promise.”',
      visuals: [{ kind: 'image', src: CARL_PORTRAIT, alt: 'Carl' }],
      nextStepId: 'carl-hub',
    },
    {
      id: 'carl-self-msg',
      type: 'message',
      text:
        'He smiles slightly. “I am Carl—caretaker, busybody, and occasionally a guide. I keep stories from stumbling into the wrong hands.”',
      visuals: [{ kind: 'image', src: CARL_PORTRAIT, alt: 'Carl' }],
      nextStepId: 'carl-hub',
    },
  ],
});
