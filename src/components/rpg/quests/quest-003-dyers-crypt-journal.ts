/** Play-tab journal recap for `quest-003-dyers-crypt` (day 2 forest arc). */

import { ANCIENT_CEMETERY_DISCOVERED_FLAG } from '../constants';
import {
  DYERS_CRYPT_MUSHROOM_EAT_1_FLAG,
  DYERS_CRYPT_MUSHROOM_EAT_2_FLAG,
  DYERS_CRYPT_MUSHROOM_EAT_3_FLAG,
} from './quest-003-dyers-crypt';
import {
  FIRST_NIGHT_FLAG_CALL_HELP,
  FIRST_NIGHT_FLAG_FOOD,
  FIRST_NIGHT_FLAG_HIGH_GROUND,
  FIRST_NIGHT_FLAG_POCKETS,
  FIRST_NIGHT_FLAG_SHELTER,
  FIRST_NIGHT_FLAG_TREE,
  FIRST_NIGHT_FLAG_TRAILS,
  FIRST_NIGHT_FLAG_WATER,
} from './quest-002-first-night';

function has(history: string[], choiceId: string): boolean {
  return history.includes(choiceId);
}

/** Sunset carry-over → how the player reached the mushroom patch. */
function buildContextClause(flags: string[]): string {
  if (flags.includes(FIRST_NIGHT_FLAG_WATER)) {
    return 'You were following the water downstream when you found a mushroom patch.';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_TRAILS)) {
    return 'You were following an animal trail when you found a mushroom patch.';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_FOOD)) {
    return 'You were searching for food when you found a mushroom patch.';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_HIGH_GROUND)) {
    return 'You climbed toward higher ground when you found a mushroom patch.';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_SHELTER)) {
    return 'You left your shelter when you found a mushroom patch.';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_TREE)) {
    return 'You climbed down from the tree when you found a mushroom patch.';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_POCKETS)) {
    return 'You moved on through the forest when you found a mushroom patch.';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_CALL_HELP)) {
    return 'You pushed deeper into the forest when you found a mushroom patch.';
  }
  return 'You pressed on through the forest when you found a mushroom patch.';
}

function buildMushroomClause(history: string[], flags: string[]): string | null {
  if (has(history, 'dyers-leave')) {
    return 'You left the mushrooms alone.';
  }
  if (flags.includes(DYERS_CRYPT_MUSHROOM_EAT_3_FLAG)) {
    return 'You ate several of the mushrooms until the forest swam.';
  }
  if (flags.includes(DYERS_CRYPT_MUSHROOM_EAT_2_FLAG)) {
    return 'You ate more of the mushrooms.';
  }
  if (flags.includes(DYERS_CRYPT_MUSHROOM_EAT_1_FLAG)) {
    return 'You ate more of the mushrooms.';
  }
  if (
    has(history, 'dyers-taste') ||
    has(history, 'dyers-continue-after-taste') ||
    has(history, 'dyers-continue-1') ||
    has(history, 'dyers-continue-2')
  ) {
    return 'You tasted a mushroom but did not eat more.';
  }
  return null;
}

function buildSkeletonClause(history: string[], flags: string[]): string {
  const discovered = flags.includes(ANCIENT_CEMETERY_DISCOVERED_FLAG);

  if (has(history, 'skeleton-follow')) {
    if (has(history, 'skeleton-follow-inside') || has(history, 'skeleton-fight-flee') || has(history, 'skeleton-run-away-inside')) {
      return "A skeleton shambled by, and you followed it into Dyer's Crypt before fleeing the dead rising from the earth.";
    }
    if (has(history, 'skeleton-come-back-later') || has(history, 'skeleton-found-leave')) {
      return "A skeleton shambled by, and you followed it to Dyer's Crypt, but you crept away before entering.";
    }
    return "A skeleton shambled by, and you followed it, discovering Dyer's Crypt.";
  }

  if (has(history, 'skeleton-hide') && discovered) {
    if (has(history, 'skeleton-found-enter') || has(history, 'skeleton-fight-flee') || has(history, 'skeleton-run-away-inside')) {
      return "A skeleton shambled by; you hid until it passed, then found Dyer's Crypt and entered before fleeing the dead.";
    }
    if (has(history, 'skeleton-found-leave')) {
      return "A skeleton shambled by; you hid until it passed, then found Dyer's Crypt but crept away before entering.";
    }
    return "A skeleton shambled by; you hid until it passed, then found Dyer's Crypt nearby.";
  }

  if (has(history, 'skeleton-attack-flee') || has(history, 'skeleton-cast-flee')) {
    if (has(history, 'skeleton-fight-flee') || has(history, 'skeleton-run-away-inside')) {
      return "A skeleton shambled by; you challenged it, fled, and ran straight into Dyer's Crypt before escaping the dead rising from the earth.";
    }
    return "A skeleton shambled by; you challenged it, fled, and ran straight into Dyer's Crypt.";
  }

  if (has(history, 'skeleton-hide')) {
    return 'A skeleton shambled by; you hid until it passed.';
  }

  return 'A skeleton shambled by in the woods.';
}

/** Appended to the Dyer's Crypt journal when `quest-004-abandoned-shelter` completes. */
export const DYERS_CRYPT_SHELTER_EPILOGUE =
  'You found an abandoned shelter and slept for the night.';

export function buildAbandonedShelterJournalEpilogue(): string {
  return DYERS_CRYPT_SHELTER_EPILOGUE;
}

export function buildDyersCryptJournalSummary(choiceHistory: string[], flags: string[]): string {
  const parts: string[] = [buildContextClause(flags)];
  const mushroom = buildMushroomClause(choiceHistory, flags);
  if (mushroom) parts.push(mushroom);
  parts.push(buildSkeletonClause(choiceHistory, flags));
  return parts.join(' ');
}
