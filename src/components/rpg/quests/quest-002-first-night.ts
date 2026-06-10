import { makeQuestAvailability } from './branching-quest-template';
import { createQuestDefinition } from './quest-authoring-tool';

const SKELETON_ENCOUNTER_ART = 'art/converted/skeleton2.webp';

const skeletonEncounterVisual = {
  kind: 'image' as const,
  src: SKELETON_ENCOUNTER_ART,
  alt: 'A living skeleton in the woods',
};

export const FIRST_NIGHT_FLAG_SHELTER = 'quest-002-first-night-shelter';
export const FIRST_NIGHT_FLAG_POCKETS = 'quest-002-first-night-pockets';
export const FIRST_NIGHT_FLAG_TREE = 'quest-002-first-night-tree';
export const FIRST_NIGHT_FLAG_WATER = 'quest-002-first-night-water';
export const FIRST_NIGHT_FLAG_STREAM_DRINK = 'quest-002-first-night-stream-drink';
export const FIRST_NIGHT_FLAG_TRAILS = 'quest-002-first-night-trails';
export const FIRST_NIGHT_FLAG_CALL_HELP = 'quest-002-first-night-call-help';
export const FIRST_NIGHT_FLAG_FOOD = 'quest-002-first-night-food';
export const FIRST_NIGHT_FLAG_HIGH_GROUND = 'quest-002-first-night-high-ground';
export const FIRST_NIGHT_FLAG_POCKET_FLASK = 'quest-002-first-night-pocket-flask';
export const FIRST_NIGHT_FLAG_POCKET_CIGARETTES = 'quest-002-first-night-pocket-cigarettes';
export const FIRST_NIGHT_FLAG_POCKET_CELL_PHONE = 'quest-002-first-night-pocket-cell-phone';
export const FIRST_NIGHT_FLAG_USED_FLASK = 'quest-002-first-night-used-flask';
export const FIRST_NIGHT_FLAG_USED_CIGARETTES = 'quest-002-first-night-used-cigarettes';
export const FIRST_NIGHT_FLAG_USED_CELL_PHONE = 'quest-002-first-night-used-cell-phone';
export const FIRST_NIGHT_FLAG_SKELETON_ITEM_HATCHET = 'quest-002-first-night-skeleton-item-hatchet';
export const FIRST_NIGHT_FLAG_SKELETON_ITEM_PICKAXE = 'quest-002-first-night-skeleton-item-pickaxe';
export const FIRST_NIGHT_FLAG_SKELETON_ITEM_HAMMER = 'quest-002-first-night-skeleton-item-hammer';
export const FIRST_NIGHT_FLAG_SKELETON_ITEM_CHISEL = 'quest-002-first-night-skeleton-item-chisel';
/** @deprecated Legacy saves only */
export const FIRST_NIGHT_FLAG_STILL = 'quest-002-first-night-still';

const SKELETON_JOURNAL_LINE = 'You fought a shambling skeleton in the woods.';

export const quest002FirstNight = createQuestDefinition({
  id: 'quest-002-first-night',
  title: 'Instinct',
  briefing: 'Every choice is permanent.  Choose wisely.',
  createdAt: 2,
  startStepId: 'skeleton-first-encounter',
  questCardImageSide: 'right',
  isAvailable: makeQuestAvailability({
    requiresAnyCompletedQuestIds: ['quest-001-origin'],
  }),
  journalSummaryFallback: SKELETON_JOURNAL_LINE,
  steps: [
    {
      id: 'skeleton-first-encounter',
      type: 'choice',
      text:
        'A horrible living skeleton is shambling through the woods.\n\nIt\'s holding something in it\'s hand. Looks like a...',
      visuals: [skeletonEncounterVisual],
      choices: [
        {
          id: 'skeleton-item-guess-hatchet',
          label: 'A Hatchet',
          nextStepId: 'skeleton-item-hatchet',
          effects: { flagsSet: [FIRST_NIGHT_FLAG_SKELETON_ITEM_HATCHET] },
        },
        {
          id: 'skeleton-item-guess-pickaxe',
          label: 'Small Pickaxe',
          nextStepId: 'skeleton-item-pickaxe',
          effects: { flagsSet: [FIRST_NIGHT_FLAG_SKELETON_ITEM_PICKAXE] },
        },
        {
          id: 'skeleton-item-guess-hammer',
          label: "A Blacksmith's Hammer",
          nextStepId: 'skeleton-item-hammer',
          effects: { flagsSet: [FIRST_NIGHT_FLAG_SKELETON_ITEM_HAMMER] },
        },
        {
          id: 'skeleton-item-guess-chisel',
          label: "A Stone Mason's Chisel",
          nextStepId: 'skeleton-item-chisel',
          effects: { flagsSet: [FIRST_NIGHT_FLAG_SKELETON_ITEM_CHISEL] },
        },
      ],
    },
    {
      id: 'skeleton-item-hatchet',
      type: 'message',
      text: 'A hatchet.',
      visuals: [skeletonEncounterVisual],
      nextStepId: 'skeleton-react',
    },
    {
      id: 'skeleton-item-pickaxe',
      type: 'message',
      text: 'A small pickaxe.',
      visuals: [skeletonEncounterVisual],
      nextStepId: 'skeleton-react',
    },
    {
      id: 'skeleton-item-hammer',
      type: 'message',
      text: "A blacksmith's hammer.",
      visuals: [skeletonEncounterVisual],
      nextStepId: 'skeleton-react',
    },
    {
      id: 'skeleton-item-chisel',
      type: 'message',
      text: "A stone mason's chisel.",
      visuals: [skeletonEncounterVisual],
      nextStepId: 'skeleton-react',
    },
    {
      id: 'skeleton-react',
      type: 'choice',
      text: 'What do you do?',
      visuals: [skeletonEncounterVisual],
      choices: [
        {
          id: 'skeleton-react-attack',
          label: 'Attack',
          nextStepId: 'skeleton-act-attack',
        },
        {
          id: 'skeleton-react-cast',
          label: 'Cast a Spell',
          nextStepId: 'skeleton-act-cast',
        },
        {
          id: 'skeleton-react-hide',
          label: 'Hide',
          nextStepId: 'skeleton-act-hide',
        },
        {
          id: 'skeleton-react-run',
          label: 'Run',
          nextStepId: 'skeleton-act-run',
        },
      ],
    },
    {
      id: 'skeleton-act-attack',
      type: 'message',
      text: 'You engage the skeleton with a Heavy Attack.',
      visuals: [skeletonEncounterVisual],
      effects: { modifiersDelta: { Heavy_AttackSkill: 1 } },
      nextStepId: 'skeleton-combat',
    },
    {
      id: 'skeleton-act-cast',
      type: 'message',
      text: "You surprise yourself by casting a tiny spark in the skeleton's direction.",
      visuals: [skeletonEncounterVisual],
      effects: { modifiersDelta: { SparkSpell: 1 } },
      nextStepId: 'skeleton-combat',
    },
    {
      id: 'skeleton-act-hide',
      type: 'message',
      text: 'You attempt to creep behind a tree, but a snapping branch alerts the skeleton to your position.',
      visuals: [skeletonEncounterVisual],
      effects: { modifiersDelta: { StealthSkill: 1 } },
      nextStepId: 'skeleton-combat',
    },
    {
      id: 'skeleton-act-run',
      type: 'message',
      text: 'You try to run but trip instead. Terrified, you unleash a wild attack on the skeleton.',
      visuals: [skeletonEncounterVisual],
      effects: { modifiersDelta: { Wild_AttackSkill: 1 } },
      nextStepId: 'skeleton-combat',
    },
    {
      id: 'skeleton-combat',
      type: 'choice',
      text: '',
      visuals: [skeletonEncounterVisual],
      choices: [
        {
          id: 'skeleton-fight',
          label: 'Attack',
          combatEncounterId: 'skeleton',
          nextStepId: 'skeleton-loot',
        },
      ],
    },
    {
      id: 'skeleton-loot',
      type: 'choice',
      text: 'The skeleton collapses. You take what it was carrying.',
      visuals: [skeletonEncounterVisual],
      choices: [
        {
          id: 'skeleton-loot-hatchet',
          label: 'Take the hatchet',
          completeQuest: true,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_SKELETON_ITEM_HATCHET],
          effects: {
            modifiersDelta: { 'item:hatchet': 1 },
          },
          journalSummaryLineAdd: SKELETON_JOURNAL_LINE,
        },
        {
          id: 'skeleton-loot-pickaxe',
          label: 'Take the pickaxe',
          completeQuest: true,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_SKELETON_ITEM_PICKAXE],
          effects: {
            modifiersDelta: { 'item:small-pickaxe': 1 },
          },
          journalSummaryLineAdd: SKELETON_JOURNAL_LINE,
        },
        {
          id: 'skeleton-loot-hammer',
          label: 'Take the hammer',
          completeQuest: true,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_SKELETON_ITEM_HAMMER],
          effects: {
            modifiersDelta: { 'item:blacksmith-hammer': 1 },
          },
          journalSummaryLineAdd: SKELETON_JOURNAL_LINE,
        },
        {
          id: 'skeleton-loot-chisel',
          label: 'Take the chisel',
          completeQuest: true,
          enabledIfAnyFlags: [FIRST_NIGHT_FLAG_SKELETON_ITEM_CHISEL],
          effects: {
            modifiersDelta: { 'item:stone-mason-chisel': 1 },
          },
          journalSummaryLineAdd: SKELETON_JOURNAL_LINE,
        },
      ],
    },
    /** Legacy — old saves mid skeleton beat (pre two-phase flow). */
    {
      id: 'skeleton-legacy-combat',
      type: 'choice',
      text: '',
      visuals: [skeletonEncounterVisual],
      choices: [
        {
          id: 'skeleton-attack',
          label: 'Attack',
          combatEncounterId: 'skeleton',
          completeQuest: true,
          journalSummaryLineAdd: SKELETON_JOURNAL_LINE,
        },
        {
          id: 'skeleton-after-combat',
          label: 'Continue',
          completeQuest: true,
          journalSummaryLineAdd: SKELETON_JOURNAL_LINE,
        },
      ],
    },
  ],
});
