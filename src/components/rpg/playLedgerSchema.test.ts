import { describe, expect, it } from 'vitest';
import { appendDialogue, CHARACTER_UPDATE_SPEAKER } from './dialogueFormat';
import { VILLAGE_PHASE_FLAG } from './constants';
import {
  dialogueLinesForPlayFeed,
  getLedgerMaxAtMs,
  getPlayLedgerMaxAtMs,
  stampDialogueEntriesAfterLedger,
  stampJournalRecapAtMs,
} from './playLedgerSchema';
import type { JournalLogEntry } from './quests/types';

describe('dialogueLinesForPlayFeed', () => {
  it('keeps quest-tagged character updates; hides forest Day Report pacing lines', () => {
    const questNarrator = appendDialogue('Quest Narrator', 'What do you do?', {
      sourceQuestId: 'quest-002-first-night',
    });
    const reward = appendDialogue(CHARACTER_UPDATE_SPEAKER, 'You learn Stealth!', {
      sourceQuestId: 'quest-002-first-night',
    });
    const dayReport = appendDialogue('Day Report', 'Day 2 Report');

    const lines = dialogueLinesForPlayFeed([questNarrator, reward, dayReport], [], 50);

    expect(lines.map((line) => line.text)).toEqual(['You learn Stealth!']);
  });

  it('keeps Day Report lines after village phase', () => {
    const dayReport = appendDialogue('Day Report', 'Day 2 Report');
    const lines = dialogueLinesForPlayFeed([dayReport], [VILLAGE_PHASE_FLAG], 50);
    expect(lines.map((line) => line.text)).toEqual(['Day 2 Report']);
  });
});
describe('stampDialogueEntriesAfterLedger', () => {
  it('places new lines after the latest ledger timestamp', () => {
    const dialogueLog = [appendDialogue('Narrator', 'Earlier beat')];
    const worldEventLog = [{ atMs: dialogueLog[0].atMs + 50, text: 'World print' }];
    const report = [
      appendDialogue('Day Report', 'Day 3 Report'),
      appendDialogue('Day Report', 'Day 4 begins'),
    ];

    const stamped = stampDialogueEntriesAfterLedger(report, dialogueLog, worldEventLog);

    expect(stamped[0].atMs).toBeGreaterThan(worldEventLog[0].atMs);
    expect(stamped[1].atMs).toBe(stamped[0].atMs + 1);
    expect(getLedgerMaxAtMs([...dialogueLog, ...stamped], worldEventLog)).toBe(stamped[1].atMs);
  });

  it('stamps dialogue after journal recaps on the Play ledger', () => {
    const dialogueLog = [appendDialogue('Narrator', 'Earlier beat')];
    const worldEventLog: { atMs: number; text: string }[] = [];
    const journalLog: JournalLogEntry[] = [
      { id: 'j1', questId: 'quest-001-origin', text: 'Origin recap.', atMs: dialogueLog[0].atMs + 100 },
    ];
    const update = [appendDialogue('Character Update', 'You learn Stealth!')];

    const stamped = stampDialogueEntriesAfterLedger(update, dialogueLog, worldEventLog, journalLog);

    expect(stamped[0].atMs).toBeGreaterThan(journalLog[0].atMs);
    expect(getPlayLedgerMaxAtMs([...dialogueLog, ...stamped], worldEventLog, journalLog)).toBe(
      stamped[0].atMs
    );
  });

  it('stampJournalRecapAtMs follows existing ledger rows', () => {
    const dialogueLog = [appendDialogue('Character Update', 'You learn Stealth!', { characterUpdateKind: 'skill' })];
    const atMs = stampJournalRecapAtMs(dialogueLog, [], []);
    expect(atMs).toBeGreaterThan(dialogueLog[0].atMs);
  });
});
