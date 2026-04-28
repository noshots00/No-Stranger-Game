export interface GameItem {
  id: string;
  name: string;
  description: string;
  type: 'resource' | 'tool' | 'quest' | 'consumable';
  stackable: boolean;
  baseValue: number;
  iconPlaceholder: string;
}

export const ITEMS: Record<string, GameItem> = {
  'wolf-hide': {
    id: 'wolf-hide',
    name: 'Wolf Hide',
    description: 'A tough pelt valued by crafters and tanners.',
    type: 'resource',
    stackable: true,
    baseValue: 5,
    iconPlaceholder: '/placeholders/items/wolf-hide.png',
  },
  'boar-meat': {
    id: 'boar-meat',
    name: 'Boar Meat',
    description: 'Fresh cut from a difficult hunt.',
    type: 'resource',
    stackable: true,
    baseValue: 3,
    iconPlaceholder: '/placeholders/items/boar-meat.png',
  },
  'herb-bundle': {
    id: 'herb-bundle',
    name: 'Herb Bundle',
    description: 'Useful to healers and cooks alike.',
    type: 'resource',
    stackable: true,
    baseValue: 2,
    iconPlaceholder: '/placeholders/items/herb-bundle.png',
  },
};

export const getItemName = (itemId: string): string => ITEMS[itemId]?.name ?? itemId;
