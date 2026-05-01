import { createTwoDialoguePlaceholderQuest } from './two-dialogue-placeholder-quest';

export const quest003SilverLake = createTwoDialoguePlaceholderQuest({
  id: 'quest-003-silver-lake',
  title: 'Silver Lake',
  briefing: 'A still sheet of water beyond the pines. Placeholder beats until modifiers are wired.',
  createdAt: 3,
  minExplorationLevel: 4,
  stepPrefix: 'silver',
  completionFlags: ['silver-lake-unlocked'],
});
