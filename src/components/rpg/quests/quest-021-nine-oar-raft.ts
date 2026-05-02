import { LIFEBOAT_DAILY_FLAG } from '../constants';
import { createBranchingQuest } from './branching-quest-template';

export const quest021NineOarRaft = createBranchingQuest({
  id: 'quest-021-nine-oar-raft',
  title: 'The Nine-Oar Raft',
  briefing: 'Fifteen souls, ten oar-spaces, a river that will not slow.',
  createdAt: 21,
  startStepId: 'lifeboat-intro',
  availability: { requiresAnyFlags: [LIFEBOAT_DAILY_FLAG] },
  steps: [
    {
      id: 'lifeboat-intro',
      type: 'choice',
      text: 'A river-galleon split on the rocks at dusk. The lashed raft holds ten — fifteen of you cling to its rails as the river climbs your knees. Eyes find yours. Who decides?',
      choices: [
        {
          id: 'lifeboat-decide-self',
          label: 'You decide alone — claim authority before anyone else does',
          nextStepId: 'lifeboat-decide',
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              MageClass: 1,
              RiverKingdomRace: 1,
              IntelligenceStat: 1,
              CourageTrait: 1,
              Resolute: 1,
            },
          },
          worldEventLogAdd: ['{playerName} stood at the raft\'s prow and called for silence.'],
        },
        {
          id: 'lifeboat-decide-lots',
          label: 'Cut reeds — let lots decide',
          nextStepId: 'lifeboat-lots',
          effects: {
            modifiersDelta: {
              RangerClass: 1,
              HalflingRace: 1,
              CatfolkRace: 1,
              DexterityStat: 1,
              CautiousTrait: 1,
              Content: 1,
            },
          },
          worldEventLogAdd: ['{playerName} sliced reeds into uneven lengths and held them in a closed fist.'],
        },
        {
          id: 'lifeboat-decide-refuse',
          label: 'Refuse to choose — offer to leave the raft yourself if needed',
          nextStepId: 'lifeboat-refuse',
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              SunbornRace: 1,
              TrollRace: 1,
              ConstitutionStat: 1,
              CourageTrait: 1,
              Selfless: 1,
            },
          },
          worldEventLogAdd: ['{playerName} stepped to the rail and would not name another soul.'],
        },
      ],
    },
    {
      id: 'lifeboat-decide',
      type: 'choice',
      text: 'Eyes pin you from the raft. The water is ankle-deep already.',
      choices: [
        {
          id: 'lifeboat-decide-elders',
          label: 'Push the elders into the water — they have lived already',
          nextStepId: 'lifeboat-outcome-elders',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              WarriorClass: 1,
              OrcRace: 1,
              StrengthStat: 1,
              CowardTrait: 1,
              Haunted: 1,
              BashSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} pried the elders\' hands free of the rail one by one.'],
        },
        {
          id: 'lifeboat-decide-strong',
          label: 'Push the strongest swimmers — they have a chance',
          nextStepId: 'lifeboat-outcome-strong',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              RangerClass: 1,
              WoodElfRace: 1,
              AtlantiansRace: 1,
              WisdomStat: 1,
              CourageTrait: 1,
              SwimmingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} pointed at the broadest shoulders and sent them into the dark.'],
        },
      ],
    },
    {
      id: 'lifeboat-lots',
      type: 'choice',
      text: 'Reeds in your fist. The first three drawn name a child.',
      choices: [
        {
          id: 'lifeboat-lots-honor',
          label: 'Honor the lots — the child goes',
          nextStepId: 'lifeboat-outcome-honor',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              RangerClass: 1,
              HalflingRace: 1,
              ConstitutionStat: 1,
              TemperanceTrait: 1,
              Haunted: 1,
            },
          },
          worldEventLogAdd: ['{playerName} held the rules above the child and did not look down.'],
        },
        {
          id: 'lifeboat-lots-redraw',
          label: 'Re-draw — cheat the lots for mercy',
          nextStepId: 'lifeboat-outcome-redraw',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              HighElfRace: 1,
              CatfolkRace: 1,
              CharismaStat: 1,
              CourageTrait: 1,
              Hopeful: 1,
              HealingSpell: 1,
              SpellcastingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} dropped the reed into the river and called for fresh ones.'],
        },
      ],
    },
    {
      id: 'lifeboat-refuse',
      type: 'choice',
      text: 'Your hand finds the lip of the raft. The river breathes against your shins.',
      choices: [
        {
          id: 'lifeboat-refuse-slip',
          label: 'Slip into the water yourself',
          nextStepId: 'lifeboat-outcome-slip',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              HealerClass: 1,
              TrollRace: 1,
              SunbornRace: 1,
              ConstitutionStat: 1,
              CourageTrait: 1,
              Selfless: 1,
              SwimmingSkill: 1,
            },
          },
          worldEventLogAdd: ['{playerName} let go of the rail without a word.'],
        },
        {
          id: 'lifeboat-refuse-stay',
          label: 'Stay — the raft sinks because no one would step off',
          nextStepId: 'lifeboat-outcome-stay',
          completeQuest: true,
          effects: {
            modifiersDelta: {
              MageClass: 1,
              NightElfRace: 1,
              RiverKingdomRace: 1,
              IntelligenceStat: 1,
              CowardTrait: 1,
              Haunted: 1,
            },
          },
          worldEventLogAdd: ['{playerName} held the rail until the deck went under.'],
        },
      ],
    },
    {
      id: 'lifeboat-outcome-elders',
      type: 'message',
      text: 'The raft rides higher. The young live. You will see those faces in still water for a long time, and you will know which of them you took.',
      completeQuest: true,
    },
    {
      id: 'lifeboat-outcome-strong',
      type: 'message',
      text: 'Two of them make the bank. One does not. The raft holds. The frail thank you in voices you cannot quite face.',
      completeQuest: true,
    },
    {
      id: 'lifeboat-outcome-honor',
      type: 'message',
      text: 'The mother does not scream. That is somehow worse. The raft floats. You float on it. You do not feel like a person who deserves to.',
      completeQuest: true,
    },
    {
      id: 'lifeboat-outcome-redraw',
      type: 'message',
      text: 'The child stays. Two grown souls go. They go quietly, knowing what you did. You will think of their quiet for years, and call it a kind of grace.',
      completeQuest: true,
    },
    {
      id: 'lifeboat-outcome-slip',
      type: 'message',
      text: 'The river is colder than you imagined. The raft pulls away in the dark. You make the bank — barely — by the next bend, lungs burning. They will name a child for you, you hear, much later.',
      completeQuest: true,
    },
    {
      id: 'lifeboat-outcome-stay',
      type: 'message',
      text: 'The raft tips, then folds. Hands grasp at hands; the river takes the lot of you. You cling to a board, alone, for a long stretch of dawn. You are the one who could not choose; you are the one who is left.',
      completeQuest: true,
    },
  ],
});
