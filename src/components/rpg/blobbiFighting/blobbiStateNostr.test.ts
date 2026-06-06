import { describe, expect, it } from 'vitest';

import { parseBlobbiState } from './blobbiStateNostr';
import { BLOBBI_STATE_KIND } from './constants';

const PUBKEY = 'a'.repeat(64);

describe('parseBlobbiState', () => {
  it('parses Ditto canonical visual tags and name', () => {
    const row = parseBlobbiState({
      id: '1',
      pubkey: PUBKEY,
      sig: '',
      kind: BLOBBI_STATE_KIND,
      created_at: 1_700_000_000,
      tags: [
        ['d', 'blobbi-fluffy'],
        ['name', 'Fluffy'],
        ['stage', 'baby'],
        ['health', '90'],
        ['base_color', '#7C3AED'],
        ['secondary_color', '#F59E0B'],
        ['eye_color', '#111827'],
        ['pattern', 'spotted'],
        ['special_mark', 'star'],
        ['size', 'medium'],
        ['seed', 'c'.repeat(64)],
      ],
      content: 'Legacy content line',
    });

    expect(row).not.toBeNull();
    expect(row?.displayName).toBe('Fluffy');
    expect(row?.baseColor).toBe('#7C3AED');
    expect(row?.secondaryColor).toBe('#F59E0B');
    expect(row?.pattern).toBe('spotted');
    expect(row?.specialMark).toBe('star');
    expect(row?.dittoPageUrl).toMatch(/^https:\/\/ditto\.pub\/naddr1/);
  });

  it('extracts imeta image URL when present', () => {
    const row = parseBlobbiState({
      id: '2',
      pubkey: PUBKEY,
      sig: '',
      kind: BLOBBI_STATE_KIND,
      created_at: 1_700_000_100,
      tags: [
        ['d', 'blobbi-pic'],
        ['stage', 'adult'],
        ['health', '80'],
        ['imeta', 'url https://blossom.ditto.pub/abc.jpeg', 'm image/jpeg'],
      ],
      content: '',
    });

    expect(row?.imageUrl).toBe('https://blossom.ditto.pub/abc.jpeg');
  });
});
