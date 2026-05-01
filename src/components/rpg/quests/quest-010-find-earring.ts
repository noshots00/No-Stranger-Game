import { EARRING_DAILY_FLAG } from '../constants';
import { createFindItemQuest } from './find-item-quest-template';

export const quest010FindEarring = createFindItemQuest({
  id: 'quest-010-find-earring',
  title: 'Find an Earring',
  createdAt: 11,
  itemName: 'an earring',
  activationFlag: EARRING_DAILY_FLAG,
});
