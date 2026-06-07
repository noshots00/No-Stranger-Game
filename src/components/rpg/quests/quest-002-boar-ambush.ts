import { meetsMinDay } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const WILD_BOAR_ART = 'art/converted/eb1911-painting-plate-ii-fig-4.webp';

const wildBoarVisual = {
  kind: 'image' as const,
  src: WILD_BOAR_ART,
  alt: 'Cave painting of a wild boar',
  fit: 'contain' as const,
};

function makeBoarOutcomeStep(id: string, outcomeLine: string) {
  return {
    id,
    type: 'message' as const,
    text: `${outcomeLine}\n\nThe boar ran away and you are unharmed.`,
    requireContinueTap: true,
    nextStepId: 'boar-complete',
    visuals: [wildBoarVisual],
  };
}

export const quest002BoarAmbush = createQuestDefinition({
  id: 'quest-002-boar-ambush',
  title: 'Boar in the Brush',
  briefing: 'A wild boar charges from the treeline. Your instinct defines your path.',
  createdAt: 2,
  isAvailable: (context) => context.explorationLevel >= 2 && meetsMinDay(context, 2),
  journalSummaryFallback: 'Boar in the Brush',
  startStepId: 'boar-attack',
  steps: [
    {
      id: 'boar-attack',
      type: 'choice',
      text: 'While exploring in the woods, you are suddenly attacked by a wild boar!',
      visuals: [wildBoarVisual],
      worldEventLogAfterChoice: ['You fended off a wild boar!'],
      choices: [
        {
          id: 'q2-strike-it',
          label: 'Strike it!',
          nextStepId: 'boar-outcome-strike',
          journalSummaryLineAdd: 'You fended off a boar by attacking it.',
          effects: {
            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-cast-spell',
          label: 'cast a spell',
          nextStepId: 'boar-outcome-spell',
          journalSummaryLineAdd: 'You fended off the boar by using magic.',
          effects: {
            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-try-dodge',
          label: 'try to dodge',
          nextStepId: 'boar-outcome-dodge',
          journalSummaryLineAdd: 'You fended off a boar by dodging it.',
          effects: {
            flagsSet: ['quest002-complete'],
          },
        },
        {
          id: 'q2-run-away',
          label: 'run away',
          nextStepId: 'boar-outcome-run',
          journalSummaryLineAdd: 'You fended off a boar by running from it.',
          effects: {
            flagsSet: ['quest002-complete'],
          },
        },
      ],
    },
    makeBoarOutcomeStep('boar-outcome-strike', 'You fended off the boar by attacking it.'),
    makeBoarOutcomeStep('boar-outcome-spell', 'You fended off the boar by using magic.'),
    makeBoarOutcomeStep('boar-outcome-dodge', 'You fended off the boar by dodging it.'),
    makeBoarOutcomeStep('boar-outcome-run', 'You fended off the boar by running from it.'),
    /** Legacy — old saves on shared outcome beat. */
    {
      id: 'boar-outcome',
      type: 'message',
      text: 'Good job!  The boar ran away and you are unharmed.',
      requireContinueTap: true,
      visuals: [wildBoarVisual],
      nextStepId: 'boar-complete',
    },
    {
      id: 'boar-complete',
      type: 'message',
      text: '',
      completeQuest: true,
    },
  ],
});
