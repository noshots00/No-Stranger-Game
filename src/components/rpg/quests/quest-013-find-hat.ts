import { HAT_DAILY_FLAG } from '../constants';
import { createFindItemQuest } from './find-item-quest-template';

export const quest013FindHat = createFindItemQuest({
  id: 'quest-013-find-hat',
  title: 'Find a Hat',
  createdAt: 14,
  itemName: 'a hat',
  activationFlag: HAT_DAILY_FLAG,
});
