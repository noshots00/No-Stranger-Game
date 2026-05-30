/** Play-tab journal recap for `quest-005-forest-cave` (Day 3 forest arc). */

import {
  resolveForestCavePrimaryKnockoutStepId,
  resolveForestCavePrimaryWakeStepId,
} from './quest-005-forest-cave';

function knockoutJournalLine(flags: readonly string[]): string {
  switch (resolveForestCavePrimaryKnockoutStepId(flags)) {
    case 'knockout-water':
      return 'You slipped into the stream and were pulled under.';
    case 'knockout-trails':
      return 'A giant cave bear knocked you senseless.';
    case 'knockout-food':
      return 'Glowing mushrooms put you to sleep.';
    case 'knockout-high-ground':
      return 'A rotted ladder gave way in an abandoned mine shaft.';
    default:
      return 'You blacked out in the cave.';
  }
}

function wakeJournalLine(flags: readonly string[]): string {
  switch (resolveForestCavePrimaryWakeStepId(flags)) {
    case 'wake-water':
      return 'You woke on the far side of the cave, washed out by the stream.';
    case 'wake-trails':
      return 'You woke in the den; the bear was gone.';
    case 'wake-food':
      return 'You woke among faded mushrooms; the spores had cleared.';
    case 'wake-high-ground':
      return 'You woke at the bottom of the shaft and climbed out.';
    default:
      return 'You woke at the cave mouth.';
  }
}

export function buildForestCaveJournalSummary(_choiceHistory: string[], flags: string[]): string {
  const parts = [
    'You entered a cave deep in the forest.',
    knockoutJournalLine(flags),
    'Strange memories came — five choices you cannot fully place.',
    wakeJournalLine(flags),
    'A whole day had passed when you came to.',
  ];
  return parts.join(' ');
}
