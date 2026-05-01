import { SHOE_DAILY_FLAG } from '../constants';
import { createFindItemQuest } from './find-item-quest-template';

export const quest012FindShoe = createFindItemQuest({
  id: 'quest-012-find-shoe',
  title: 'Find a Shoe',
  createdAt: 13,
  itemName: 'a shoe',
  activationFlag: SHOE_DAILY_FLAG,
});
