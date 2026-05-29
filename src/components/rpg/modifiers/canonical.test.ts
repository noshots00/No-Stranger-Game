import { describe, expect, it } from 'vitest';
import { canonicalizeModifierMap } from './canonical';

describe('canonicalizeModifierMap', () => {
  it('maps legacy Strength to stat:strength on quest apply', () => {
    expect(canonicalizeModifierMap({ Strength: 1 })).toEqual({ 'stat:strength': 1 });
  });

  it('maps StrengthStat organic key to stat:strength', () => {
    expect(canonicalizeModifierMap({ StrengthStat: 1 })).toEqual({ 'stat:strength': 1 });
  });
});
