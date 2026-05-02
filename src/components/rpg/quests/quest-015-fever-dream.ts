import { FEVER_DREAM_UNLOCKED_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest015FeverDream = createBranchingQuest({
  id: 'quest-015-fever-dream',
  title: 'Fever Dream',
  briefing: 'A restless night after the forest floor offered more than food.',
  createdAt: 16,
  startStepId: 'fever-dream-intro',
  availability: { requiresAnyFlags: [FEVER_DREAM_UNLOCKED_FLAG] },
  steps: [
    {
      id: 'fever-dream-intro',
      type: 'choice',
      text: 'Sweat mats your hair to your forehead. The fever paints visions that refuse to scatter at dawn—which nightmare owned your sleep?',
      choices: [
        {
          id: 'fever-dream-trident-court',
          label: 'Black halls beneath the tide',
          nextStepId: 'fever-dream-outcome-trident',
          effects: {
            modifiersDelta: {
              AtlantiansRace: 1,
              KnightClass: 1,
              ConstitutionStat: 1,
              CautiousTrait: 1,
              SwimmingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} recalls drowning halls hung with rusted tridents.'],
        },
        {
          id: 'fever-dream-white-sun',
          label: 'A sun that never sets',
          nextStepId: 'fever-dream-outcome-sun',
          effects: {
            modifiersDelta: {
              SunbornRace: 1,
              ElementalistClass: 1,
              WisdomStat: 1,
              Haunted: 1,
              CowardTrait: 1,
              ElementalSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} woke tasting brass and salt wind—noon stretched into forever.'],
        },
        {
          id: 'fever-dream-lotus-ledger',
          label: 'Endless stairs of stamped contracts',
          nextStepId: 'fever-dream-outcome-ledger',
          effects: {
            modifiersDelta: {
              RiverKingdomRace: 1,
              EnchanterClass: 1,
              IntelligenceStat: 1,
              Paranoid: 1,
              CautiousTrait: 1,
              IllusionSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} fled ink wells and lotus seals that judged every footstep.'],
        },
        {
          id: 'fever-dream-moon-knives',
          label: 'Smiling shadows on the hunt',
          nextStepId: 'fever-dream-outcome-moon',
          effects: {
            modifiersDelta: {
              NightElfRace: 1,
              AssassinClass: 1,
              DexterityStat: 1,
              CowardTrait: 1,
              StealthSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} heard steel kiss leaves—the moon watched with too many eyes.'],
        },
        {
          id: 'fever-dream-tusk-arena',
          label: 'Cheering crowds of sharpened teeth',
          nextStepId: 'fever-dream-outcome-arena',
          effects: {
            modifiersDelta: {
              OrcRace: 1,
              BlademasterClass: 1,
              StrengthStat: 1,
              CourageTrait: 1,
              BashSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} stumbled through sand circles where tusks roared approval.'],
        },
      ],
    },
    {
      id: 'fever-dream-outcome-trident',
      type: 'message',
      text: 'You bolt upright, throat burning as if seawater had truly filled your lungs. Armor clangs in memory; the sheets are only linen, but your ribs still remember the weight.',
      completeQuest: true,
    },
    {
      id: 'fever-dream-outcome-sun',
      type: 'message',
      text: 'You wake clawing at your chest—skin cool now, yet light still bleeds through your eyelids. For an hour the horizon feels watchful, too bright to blink away.',
      completeQuest: true,
    },
    {
      id: 'fever-dream-outcome-ledger',
      type: 'message',
      text: 'Your fingers twitch as if sealing wax still burned them. The cabin wall has no staircases, yet order slips through your thoughts like ruled lines.',
      completeQuest: true,
    },
    {
      id: 'fever-dream-outcome-moon',
      type: 'message',
      text: 'Breath returns in gasps. Moonlight through the boards stitches stripes across your chest—you tell yourself nothing pads the timber outside. Your pulse disagrees.',
      completeQuest: true,
    },
    {
      id: 'fever-dream-outcome-arena',
      type: 'message',
      text: 'You sit up swinging at empty air. Echoes of chanting fade into cricket song; your knuckles ache from clenching fists that never landed a blow.',
      completeQuest: true,
    },
  ],
});
