import { describe, expect, it } from 'vitest';

import { fighterNameColor, hashBlobbiIdToColor } from './fighterNameColor';

describe('fighterNameColor', () => {
  it('uses my blobbi base color when ids match', () => {
    const color = fighterNameColor(
      { blobbiId: 'sprout-1' },
      { id: 'sprout-1', baseColor: '#ff5500' }
    );
    expect(color).toBe('#ff5500');
  });

  it('falls back to hashed color for opponents', () => {
    const color = fighterNameColor({ blobbiId: 'rival-9' });
    expect(color).toBe(hashBlobbiIdToColor('rival-9'));
  });

  it('produces stable hash colors', () => {
    expect(hashBlobbiIdToColor('blobbi-abc')).toBe(hashBlobbiIdToColor('blobbi-abc'));
    expect(hashBlobbiIdToColor('blobbi-abc')).toMatch(/^hsl\(\d+ 65% 62%\)$/);
  });
});
