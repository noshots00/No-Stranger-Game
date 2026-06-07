import { describe, expect, it } from 'vitest';
import { buildNostrKeyFileContent, parseNsecFromKeyFile } from './nostrKeyFile';

const SAMPLE_NSEC = `nsec1${'a'.repeat(58)}`;
const SAMPLE_NPUB = `npub1${'b'.repeat(58)}`;

describe('buildNostrKeyFileContent', () => {
  it('includes npub, nsec, warnings, and login instructions', () => {
    const text = buildNostrKeyFileContent({
      nsec: SAMPLE_NSEC,
      npub: SAMPLE_NPUB,
      generatedAt: new Date('2026-06-07T12:00:00'),
    });

    expect(text).toContain(SAMPLE_NSEC);
    expect(text).toContain(SAMPLE_NPUB);
    expect(text).toContain('LIKE YOUR PASSWORD');
    expect(text).toContain('cannot be changed');
    expect(text).toContain('impossible to regain control');
    expect(text).toContain('HOW TO LOG IN');
  });
});

describe('parseNsecFromKeyFile', () => {
  it('parses legacy plain nsec files', () => {
    expect(parseNsecFromKeyFile(`  ${SAMPLE_NSEC}  `)).toBe(SAMPLE_NSEC);
  });

  it('parses multi-line key files', () => {
    const file = buildNostrKeyFileContent({ nsec: SAMPLE_NSEC, npub: SAMPLE_NPUB });
    expect(parseNsecFromKeyFile(file)).toBe(SAMPLE_NSEC);
  });

  it('returns null when no valid nsec is present', () => {
    expect(parseNsecFromKeyFile('not a key file')).toBeNull();
    expect(parseNsecFromKeyFile('')).toBeNull();
  });
});
