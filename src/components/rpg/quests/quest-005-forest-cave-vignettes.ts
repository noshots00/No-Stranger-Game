import type { QuestStep } from './types';

const VIGNETTE_2 = 'vignette-stranger-in-need';
const VIGNETTE_3 = 'vignette-witness-to-lies';
const VIGNETTE_4 = 'vignette-oath-to-power';
const VIGNETTE_5 = 'vignette-last-witness';
const WAKE_ROUTE = 'wake-route';

/** Linear moral-memory vignettes (after knockout bridge). */
export const forestCaveVignetteSteps: QuestStep[] = [
  {
    id: 'dream-bridge',
    type: 'message',
    text: 'Darkness takes you. Memories crowd in — places you never walked, choices you cannot place.',
    nextStepId: 'vignette-market-coin',
  },
  {
    id: 'vignette-market-coin',
    type: 'choice',
    text: 'You remember a crowded market. Someone drops a gold coin. No one else saw.',
    choices: [
      {
        id: 'coin-nothing',
        label: 'Do nothing',
        nextStepId: VIGNETTE_2,
        effects: { modifiersDelta: { Coward: 1 } },
      },
      {
        id: 'coin-return',
        label: 'Return the coin',
        nextStepId: VIGNETTE_2,
        effects: { modifiersDelta: { HonestTrait: 1 } },
      },
      {
        id: 'coin-keep',
        label: 'Keep it',
        nextStepId: VIGNETTE_2,
        effects: { modifiersDelta: { GreedyTrait: 1, GoblinRace: 1 } },
      },
      {
        id: 'coin-call-out',
        label: 'Call out that it fell',
        nextStepId: VIGNETTE_2,
        effects: { modifiersDelta: { CourageTrait: 1 } },
      },
    ],
  },
  {
    id: VIGNETTE_2,
    type: 'choice',
    text: 'You remember a stranger begging at a gate. You have little food and a long road ahead.',
    choices: [
      {
        id: 'need-share-half',
        label: 'Share half of what you have',
        nextStepId: VIGNETTE_3,
        effects: { modifiersDelta: { HealerClass: 1, CompassionTrait: 1 } },
      },
      {
        id: 'need-refuse',
        label: 'Refuse and walk on',
        nextStepId: VIGNETTE_3,
        effects: { modifiersDelta: { RangerClass: 1 } },
      },
      {
        id: 'need-demand-payment',
        label: 'Demand payment first',
        nextStepId: VIGNETTE_3,
        effects: { modifiersDelta: { RogueClass: 1 } },
      },
    ],
  },
  {
    id: VIGNETTE_3,
    type: 'choice',
    text: 'You remember a friend lying to spare your feelings. You know the truth.',
    choices: [
      {
        id: 'lies-confront',
        label: 'Confront them',
        nextStepId: VIGNETTE_4,
        effects: { modifiersDelta: { CourageTrait: 1 } },
      },
      {
        id: 'lies-thank',
        label: 'Thank them and say nothing',
        nextStepId: VIGNETTE_4,
        effects: { modifiersDelta: { WisdomTrait: 1 } },
      },
      {
        id: 'lies-repeat-lie',
        label: 'Repeat the lie to someone else',
        nextStepId: VIGNETTE_4,
        effects: { modifiersDelta: { DeceiverTrait: 1, DrowRace: 1 } },
      },
    ],
  },
  {
    id: VIGNETTE_4,
    type: 'choice',
    text: 'You remember kneeling before a lord who offers mercy if you swear loyalty.',
    choices: [
      {
        id: 'oath-swear',
        label: 'Swear the oath',
        nextStepId: VIGNETTE_5,
        effects: { modifiersDelta: { WarriorClass: 1, LoyalTrait: 1 } },
      },
      {
        id: 'oath-refuse',
        label: 'Refuse and stand',
        nextStepId: VIGNETTE_5,
        effects: { modifiersDelta: { RebelTrait: 1 } },
      },
      {
        id: 'oath-bargain',
        label: 'Bargain for better terms',
        nextStepId: VIGNETTE_5,
        effects: { modifiersDelta: { MageClass: 1, CunningTrait: 1 } },
      },
    ],
  },
  {
    id: VIGNETTE_5,
    type: 'choice',
    text: 'You remember watching harm done in the street. You could speak, or vanish into the crowd.',
    choices: [
      {
        id: 'witness-intervene',
        label: 'Step in',
        nextStepId: WAKE_ROUTE,
        effects: { modifiersDelta: { CourageTrait: 1, HumanRace: 1 } },
      },
      {
        id: 'witness-walk-away',
        label: 'Walk away',
        nextStepId: WAKE_ROUTE,
        effects: { modifiersDelta: { Coward: 1 } },
      },
      {
        id: 'witness-watch',
        label: 'Watch and remember',
        nextStepId: WAKE_ROUTE,
        effects: { modifiersDelta: { ScholarTrait: 1 } },
      },
    ],
  },
];
