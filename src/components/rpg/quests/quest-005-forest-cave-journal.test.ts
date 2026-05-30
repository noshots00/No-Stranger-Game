import { describe, expect, it } from 'vitest';
import { FIRST_NIGHT_FLAG_WATER } from './quest-002-first-night';
import { buildForestCaveJournalSummary } from './quest-005-forest-cave-journal';

describe('Forest Cave journal', () => {
  it('summarizes water path knockout and wake', () => {
    const text = buildForestCaveJournalSummary([], [FIRST_NIGHT_FLAG_WATER]);
    expect(text).toContain('slipped into the stream');
    expect(text).toContain('far side of the cave');
    expect(text).toContain('five choices');
    expect(text).toContain('whole day had passed');
  });
});
