import { SWEET_DREAM_UNLOCKED_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest016SweetDream = createBranchingQuest({
  id: 'quest-016-sweet-dream',
  title: 'Sweet Dream',
  briefing: 'A gentle night after you walked away.',
  createdAt: 17,
  toneTag: 'echo',
  startStepId: 'sweet-dream-intro',
  availability: { requiresAnyFlags: [SWEET_DREAM_UNLOCKED_FLAG], minDay: 99 },
  steps: [
    {
      id: 'sweet-dream-intro',
      type: 'choice',
      text: 'You had a wonderful dream... what do you remember?',
      choices: [
        {
          id: 'sweet-dream-flying',
          label: 'I was flying high above the trees.',
          nextStepId: 'sweet-dream-outcome-flying',
          effects: {

          },
          worldEventLogAdd: ['{playerName} woke light-footed, remembering the canopy from above.'],
        },
        {
          id: 'sweet-dream-swimming',
          label: 'I was swimming with a beautiful stranger.',
          nextStepId: 'sweet-dream-outcome-swimming',
          effects: {

          },
          worldEventLogAdd: ['{playerName} woke smiling—a stranger\'s easy current still carried them.'],
        },
        {
          id: 'sweet-dream-telekinesis',
          label: 'I could move objects with my mind.',
          nextStepId: 'sweet-dream-outcome-telekinesis',
          effects: {

          },
          worldEventLogAdd: ['{playerName} woke with tingling hands, sure the world had once answered thought alone.'],
        },
      ],
    },
    {
      id: 'sweet-dream-outcome-flying',
      type: 'message',
      text: 'You wake with wind still in your hair and the treetops swaying though no breeze touches the cabin.',
      completeQuest: true,
    },
    {
      id: 'sweet-dream-outcome-swimming',
      type: 'message',
      text: 'You wake tasting salt you cannot place; warmth from the dream stranger still lingers on your skin.',
      completeQuest: true,
    },
    {
      id: 'sweet-dream-outcome-telekinesis',
      type: 'message',
      text: 'You wake flexing fingers that almost remember lifting cups and candles without touching them.',
      completeQuest: true,
    },
  ],
});
