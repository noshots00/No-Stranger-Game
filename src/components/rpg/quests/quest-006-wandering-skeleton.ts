import { createBranchingQuest } from './branching-quest-template';

export const quest006WanderingSkeleton = createBranchingQuest({
  id: 'quest-006-wandering-skeleton',
  title: 'Wandering Skeleton',
  briefing: 'A shambling skeleton with a woodcutter axe wanders between the trees.',
  createdAt: 6,
  startStepId: 'skeleton-intro',
  availability: {
    requiresAnyCompletedQuestIds: ['quest-001-origin'],
    requiresAnyFlags: ['quest001-complete'],
  },
  steps: [
    {
      id: 'skeleton-intro',
      type: 'choice',
      text: "You are foraging mushrooms when you hear rustling sound. A living skeleton is shambling through the woods. He is carrying a woodcutter's axe.",
      choices: [
        { id: 'skeleton-attack', label: 'Attack!', nextStepId: 'skeleton-attack-outcome' },
        { id: 'skeleton-cast', label: 'Cast a spell!', nextStepId: 'skeleton-cast-outcome' },
        { id: 'skeleton-follow', label: 'Stay hidden and follow the skeleton.', nextStepId: 'skeleton-cemetery-approach' },
        { id: 'skeleton-hide', label: "Hide until it's gone.", nextStepId: 'skeleton-hide-outcome' },
      ],
    },
    {
      id: 'skeleton-attack-outcome',
      type: 'choice',
      text: 'Sensing your presence the skeleton turns in your direction. Wielding the axe above his head he charges you.',
      choices: [{ id: 'skeleton-attack-flee', label: 'Perhaps challenging the living dead without a weapon was a bad idea (Run Away).', completeQuest: true }],
    },
    {
      id: 'skeleton-cast-outcome',
      type: 'choice',
      text: 'Your body relaxes a little as energy gathers in the palm of your hand. With a gesture in the skeltons direction a tiny spark jumps through the air, but fizzles out in mid air. The skeleton finally sees you and instantly starts running in your direction, swinging the axe wildly.',
      choices: [{ id: 'skeleton-cast-flee', label: 'You are not powerful enough to face this creature - FLEE!', completeQuest: true }],
    },
    {
      id: 'skeleton-cemetery-approach',
      type: 'choice',
      text: 'You follow the skeleton to a cemetary surrounded by an iron picket fence. A massive gate lies open in front of you and an ancient trail leads over a hill. You wonder how large the cemetary could be.',
      choices: [
        { id: 'skeleton-follow-inside', label: 'Follow the skeleton into the cemetary', nextStepId: 'skeleton-inside-gate' },
        { id: 'skeleton-come-back-later', label: 'come back later', nextStepId: 'skeleton-sneak-away' },
      ],
    },
    { id: 'skeleton-sneak-away', type: 'message', text: 'You sneak away for now', completeQuest: true },
    {
      id: 'skeleton-inside-gate',
      type: 'choice',
      text: 'Once inside the gate skeletons began climbing out of the earth.',
      choices: [
        { id: 'skeleton-fight', label: 'Fight them', nextStepId: 'skeleton-fight-outcome' },
        { id: 'skeleton-run-away-inside', label: 'Run Away', nextStepId: 'skeleton-escaped' },
      ],
    },
    {
      id: 'skeleton-fight-outcome',
      type: 'choice',
      text: 'You smash the skeleton closest to you across the face. It falls the ground with a satisfying clatter. Bony fingers wrap around your collar bone and you feel the flesh ripped from your bone. (FLEE)',
      choices: [{ id: 'skeleton-fight-flee', label: 'FLEE', nextStepId: 'skeleton-escaped' }],
    },
    { id: 'skeleton-escaped', type: 'message', text: 'You escaped into the forest.', completeQuest: true },
    { id: 'skeleton-hide-outcome', type: 'message', text: "You stay hidden until it's gone.", completeQuest: true },
  ],
});
