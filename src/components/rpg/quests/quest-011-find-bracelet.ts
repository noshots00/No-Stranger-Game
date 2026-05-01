import { BRACELET_DAILY_FLAG } from '../constants';
import { createFindItemQuest } from './find-item-quest-template';

export const quest011FindBracelet = createFindItemQuest({
  id: 'quest-011-find-bracelet',
  title: 'Find a Bracelet',
  createdAt: 12,
  itemName: 'a bracelet',
  activationFlag: BRACELET_DAILY_FLAG,
});
