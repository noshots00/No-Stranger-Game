import { describe, expect, it } from 'vitest';
import { createInitialQuestState } from './quests/engine';
import {
  MIN_SUPPORTED_CHARACTER_SAVE_APP_VERSION,
  needsMandatoryCharacterReset,
  resolveCharacterCreatedAtAppVersion,
} from './characterSaveVersion';

describe('characterSaveVersion', () => {
  it('grandfathers established saves missing characterCreatedAtAppVersion', () => {
    expect(
      resolveCharacterCreatedAtAppVersion({
        playerName: 'Aldric',
        characterCreationDateEastern: '2026-05-01',
        characterCreatedAtAppVersion: null,
      })
    ).toBe(MIN_SUPPORTED_CHARACTER_SAVE_APP_VERSION);
    const state = {
      ...createInitialQuestState(),
      playerName: 'Aldric',
      characterCreationDateEastern: '2026-05-01',
      characterCreatedAtAppVersion: null,
    };
    expect(needsMandatoryCharacterReset(state)).toBe(false);
  });

  it('still requires reset for saves below minimum version', () => {
    const state = {
      ...createInitialQuestState(),
      playerName: 'Aldric',
      characterCreationDateEastern: '2026-05-01',
      characterCreatedAtAppVersion: '0.5.1',
    };
    expect(needsMandatoryCharacterReset(state)).toBe(true);
  });
});
