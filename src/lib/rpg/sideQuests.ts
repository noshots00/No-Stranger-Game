import type { MVPCharacter } from './utils';

export type SideQuestTrigger = 'npc' | 'discovery' | 'state' | 'profession';

export interface SideQuestDefinition {
  id: string;
  title: string;
  trigger: SideQuestTrigger;
  rarityWeight: number;
  prompt: string;
  options: Array<{ id: string; label: string; effect: string }>;
}

export const SIDE_QUESTS: SideQuestDefinition[] = [
  {
    id: 'markus-ledger',
    title: 'The Lost Ledger',
    trigger: 'npc',
    rarityWeight: 2,
    prompt: 'Old Markus asks if you can recover his missing ledger.',
    options: [
      { id: 'return', label: 'Return it', effect: 'gain-trust' },
      { id: 'keep', label: 'Keep it', effect: 'gain-gold' },
      { id: 'burn', label: 'Burn it', effect: 'gain-fear' },
    ],
  },
  {
    id: 'grave-child',
    title: 'The Stuffed Bear',
    trigger: 'discovery',
    rarityWeight: 1,
    prompt: 'A child asks you to recover a stuffed bear from the graveyard edge.',
    options: [
      { id: 'help', label: 'Help the child', effect: 'gain-compassion' },
      { id: 'ignore', label: 'Ignore', effect: 'gain-cynical' },
    ],
  },
];

export const getAvailableSideQuests = (character: MVPCharacter): SideQuestDefinition[] => {
  const completed = new Set(character.completedQuests ?? []);
  return SIDE_QUESTS.filter((quest) => !completed.has(quest.id));
};
