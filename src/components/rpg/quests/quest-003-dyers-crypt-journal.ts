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

/** Sunset carry-over → journal opener ("While following the stream,"). */
function buildWhileFollowingLead(flags: string[]): string {
  if (flags.includes(FIRST_NIGHT_FLAG_WATER)) {
    return 'While following the stream';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_TRAILS)) {
    return 'While following animal tracks';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_FOOD)) {
    return 'While searching for food';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_HIGH_GROUND)) {
    return 'While climbing toward higher ground';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_SHELTER)) {
    return 'While leaving your shelter';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_TREE)) {
    return 'While climbing down from the tree';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_POCKETS)) {
    return 'While pushing deeper into the forest';
  }
  if (flags.includes(FIRST_NIGHT_FLAG_CALL_HELP)) {
    return 'While answering your own call for help';
  }
  return 'While pressing on through the forest';
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

/** Skeleton / crypt beat; `sentenceStart` = true when this opens a new sentence after a period. */
function buildSkeletonClause(history: string[], flags: string[], sentenceStart: boolean): string {
  const discovered = flags.includes(ANCIENT_CEMETERY_DISCOVERED_FLAG);
  const you = sentenceStart ? 'You' : 'you';

  if (has(history, 'skeleton-follow')) {
    if (has(history, 'skeleton-follow-inside') || has(history, 'skeleton-fight-flee') || has(history, 'skeleton-run-away-inside')) {
      return `${you} encountered a skeleton and followed it into Dyer's Crypt before fleeing the dead rising from the earth.`;
    }
    if (has(history, 'skeleton-come-back-later') || has(history, 'skeleton-found-leave')) {
      return `${you} encountered a skeleton and followed it to Dyer's Crypt, but crept away before entering.`;
    }
    return `${you} encountered a skeleton and discovered Dyer's Crypt.`;
  }

  if (has(history, 'skeleton-hide') && discovered) {
    if (has(history, 'skeleton-found-enter') || has(history, 'skeleton-fight-flee') || has(history, 'skeleton-run-away-inside')) {
      return `${you} encountered a skeleton, hid until it passed, then entered Dyer's Crypt before fleeing the dead rising from the earth.`;
    }
    if (has(history, 'skeleton-found-leave')) {
      return `${you} encountered a skeleton, hid until it passed, then found Dyer's Crypt but crept away before entering.`;
    }
    return `${you} encountered a skeleton, hid until it passed, then discovered Dyer's Crypt.`;
  }

  if (has(history, 'skeleton-attack-flee') || has(history, 'skeleton-cast-flee')) {
    if (has(history, 'skeleton-fight-flee') || has(history, 'skeleton-run-away-inside')) {
      return `${you} encountered a skeleton, challenged it, fled, and ran into Dyer's Crypt before escaping the dead rising from the earth.`;
    }
    return `${you} encountered a skeleton, challenged it, fled, and discovered Dyer's Crypt.`;
  }

  if (has(history, 'skeleton-hide')) {
    return `${you} encountered a skeleton and hid until it passed.`;
  }

  return `${you} encountered a skeleton in the woods.`;
}

/** Appended to the Dyer's Crypt journal when `quest-004-abandoned-shelter` completes. */
export const DYERS_CRYPT_SHELTER_EPILOGUE =
  'You found an abandoned shelter and slept for the night.';

export function buildAbandonedShelterJournalEpilogue(): string {
  return DYERS_CRYPT_SHELTER_EPILOGUE;
}

export function buildDyersCryptJournalSummary(choiceHistory: string[], flags: string[]): string {
  const lead = buildWhileFollowingLead(flags);
  const mushroom = buildMushroomClause(choiceHistory, flags);

  if (!mushroom) {
    const skeleton = buildSkeletonClause(choiceHistory, flags, false);
    return `${lead}, ${skeleton}`;
  }

  const parts: string[] = [`${lead}, you found a mushroom patch.`, mushroom];
  parts.push(buildSkeletonClause(choiceHistory, flags, true));
  return parts.join(' ');
}
