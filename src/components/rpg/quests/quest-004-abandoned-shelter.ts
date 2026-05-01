import { createTwoDialoguePlaceholderQuest } from './two-dialogue-placeholder-quest';

export const quest004AbandonedShelter = createTwoDialoguePlaceholderQuest({
  id: 'quest-004-abandoned-shelter',
  title: 'Abandoned Shelter',
  briefing: 'A collapsed lean-to in the brush. Placeholder beats until modifiers are wired.',
  createdAt: 4,
  minExplorationLevel: 2,
  stepPrefix: 'shelter',
  completionFlags: ['abandoned-shelter-complete'],
});
