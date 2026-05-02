import { SWEET_DREAM_UNLOCKED_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest016SweetDream = createBranchingQuest({
  id: 'quest-016-sweet-dream',
  title: 'Sweet Dream',
  briefing: 'A gentle night after you walked away.',
  createdAt: 17,
  startStepId: 'sweet-dream-intro',
  availability: { requiresAnyFlags: [SWEET_DREAM_UNLOCKED_FLAG] },
  steps: [
    {
      id: 'sweet-dream-intro',
      type: 'choice',
      text: 'Warmth lingers behind your ribs at dawn. Sleep felt kind—which dream stayed with you?',
      choices: [
        {
          id: 'sweet-dream-dawn-choir',
          label: 'Voices raised in a rose-colored dawn',
          nextStepId: 'sweet-dream-outcome-dawn',
          effects: {
            modifiersDelta: {
              SunbornRace: 1,
              HealerClass: 1,
              CharismaStat: 1,
              Hopeful: 1,
              CourageTrait: 1,
              HealingSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} woke smiling—somewhere a chorus still thanked the horizon.'],
        },
        {
          id: 'sweet-dream-moss-glade',
          label: 'A glade where deer breathe beside you',
          nextStepId: 'sweet-dream-outcome-glade',
          effects: {
            modifiersDelta: {
              WoodElfRace: 1,
              RangerClass: 1,
              WisdomStat: 1,
              Peaceful: 1,
              CautiousTrait: 1,
              SurvivalSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} carried forest quiet into morning like a blanket.'],
        },
        {
          id: 'sweet-dream-hill-feast',
          label: 'A long table and an arrow that finds the center',
          nextStepId: 'sweet-dream-outcome-feast',
          effects: {
            modifiersDelta: {
              HalflingRace: 1,
              RangerClass: 1,
              DexterityStat: 1,
              Content: 1,
              CourageTrait: 1,
              ArcherySkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} tasted honey and cordial—and the target rang true.'],
        },
        {
          id: 'sweet-dream-crystal-hall',
          label: 'Mirrors that show you at your kindest',
          nextStepId: 'sweet-dream-outcome-hall',
          effects: {
            modifiersDelta: {
              HighElfRace: 1,
              MageClass: 1,
              IntelligenceStat: 1,
              Serene: 1,
              CourageTrait: 1,
              LightSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} opened kind eyes in every reflection.'],
        },
        {
          id: 'sweet-dream-lantern-spirits',
          label: 'Tiny lights that guide you home',
          nextStepId: 'sweet-dream-outcome-lanterns',
          effects: {
            modifiersDelta: {
              GnomeRace: 1,
              MageClass: 1,
              ConstitutionStat: 1,
              Curious: 1,
              CautiousTrait: 1,
              SpiritSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} followed laughter small as bells through friendly dark.'],
        },
      ],
    },
    {
      id: 'sweet-dream-outcome-dawn',
      type: 'message',
      text: 'You stretch without hurry. The air feels redder than yesterday, as if the whole sky wished you well.',
      completeQuest: true,
    },
    {
      id: 'sweet-dream-outcome-glade',
      type: 'message',
      text: 'Leaves scrape the roof like soft footsteps; you half-expect a warm muzzle at your palm. Your shoulders drop further than they have in weeks.',
      completeQuest: true,
    },
    {
      id: 'sweet-dream-outcome-feast',
      type: 'message',
      text: 'Your belly remembers bread and laughter. Outside, the forest sounds patient—there is time enough for everything worth doing.',
      completeQuest: true,
    },
    {
      id: 'sweet-dream-outcome-hall',
      type: 'message',
      text: 'You rise believing your own courtesy was never wasted. The cabin boards are plain wood again, but your reflection still straightens its shoulders.',
      completeQuest: true,
    },
    {
      id: 'sweet-dream-outcome-lanterns',
      type: 'message',
      text: 'You tuck your boots under the cot smiling. Even the crickets seem to answer one another on purpose—like old friends checking in.',
      completeQuest: true,
    },
  ],
});
