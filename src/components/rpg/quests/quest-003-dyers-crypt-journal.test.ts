import { describe, expect, it } from 'vitest';
import { ANCIENT_CEMETERY_DISCOVERED_FLAG } from '../constants';
import {
  buildAbandonedShelterJournalEpilogue,
  buildDyersCryptJournalSummary,
  DYERS_CRYPT_SHELTER_EPILOGUE,
} from './quest-003-dyers-crypt-journal';
import { FIRST_NIGHT_FLAG_WATER } from './quest-002-first-night';

describe("Dyer's Crypt journal", () => {
  it('matches the golden-path water → follow → crypt narrative', () => {
    const text = buildDyersCryptJournalSummary(
      ['skeleton-follow'],
      [FIRST_NIGHT_FLAG_WATER, ANCIENT_CEMETERY_DISCOVERED_FLAG]
    );
    expect(text).toBe(
      "While following the stream, you encountered a skeleton and discovered Dyer's Crypt."
    );
  });

  it('appends shelter epilogue copy for abandoned shelter completion', () => {
    expect(buildAbandonedShelterJournalEpilogue()).toBe(DYERS_CRYPT_SHELTER_EPILOGUE);
  });

  it('notes fleeing into the cemetery after attacking the skeleton', () => {
    const text = buildDyersCryptJournalSummary(
      ['skeleton-attack', 'skeleton-attack-flee'],
      [FIRST_NIGHT_FLAG_WATER, ANCIENT_CEMETERY_DISCOVERED_FLAG]
    );
    expect(text).toContain('challenged it, fled');
    expect(text).toContain("discovered Dyer's Crypt");
  });

  it('notes finding the cemetery after hiding', () => {
    const text = buildDyersCryptJournalSummary(
      ['skeleton-hide'],
      [FIRST_NIGHT_FLAG_WATER, ANCIENT_CEMETERY_DISCOVERED_FLAG]
    );
    expect(text).toContain('hid until it passed');
    expect(text).toContain("discovered Dyer's Crypt");
  });
});
