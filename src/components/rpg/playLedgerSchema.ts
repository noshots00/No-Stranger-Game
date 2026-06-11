/**

 * Play tab ledger vs. quest module (forest opening → village).

 *

 * **Forest opening** (until `village-phase`): the main quest line is fully scripted. The Play

 * screen is two layers:

 * - **Ledger (permanent):** `journalLog` recaps, world "prints" (milestones, boar, etc.).
 *   Day N Report blocks appear only after the village phase. No recent-window truncation — the opening arc is short.

 * - **Quest module (interactive):** quest cards on the journal; tap opens Quest Scene.

 *   Quest-scoped lines stay on `sourceQuestId` for Chronicle; journal shows recaps.

 *

 * **Day pacing UI:** header day counter; Day N Report blocks in `dialogueLog` only after village phase.

 */



import { WORLD_EVENT_PRINTS_ENABLED } from './constants';
import {
  CLASS_LOCK_REPORT_TITLE,
  DAY_REPORT_SPEAKER,
  isCharacterUpdateSpeaker,
  RACE_LOCK_REPORT_TITLE,
} from './dialogueFormat';
import type { DialogueLogEntry, JournalLogEntry, WorldEventLogEntry } from './quests/types';
import { isVillagePhase } from './quests/engine';



const DAY_MARKER_LINE = /^Day\s+\d+\.\.\.$/;



export function isForestOpeningPhase(flags: readonly string[]): boolean {

  return !isVillagePhase(flags);

}



/** Legacy `Day N...` world prints — omitted from Play and Chronicle feeds. */

export function isPlayDayMarkerText(text: string): boolean {

  return DAY_MARKER_LINE.test(text.trim());

}



/** Forest arc omits Day N Report pacing blocks; class/race lock infographics still show. */
function isForestDayPacingReportLine(line: DialogueLogEntry): boolean {
  if (line.speaker !== DAY_REPORT_SPEAKER) return false;
  const text = line.text.trim();
  return text !== CLASS_LOCK_REPORT_TITLE && text !== RACE_LOCK_REPORT_TITLE;
}

/** Play feed: global lines + quest-tagged character updates. */
export function isPlayFeedDialogueLine(
  line: DialogueLogEntry,
  flags?: readonly string[]
): boolean {
  if (flags && isForestOpeningPhase(flags) && isForestDayPacingReportLine(line)) {
    return false;
  }
  if (!line.sourceQuestId) return true;
  return isCharacterUpdateSpeaker(line.speaker);
}

/** Global dialogue rows for the Play story stream (excludes quest-scene transcript). */
export function dialogueLinesForPlayFeed(
  dialogueLog: readonly DialogueLogEntry[],
  flags: readonly string[],
  recentMax: number
): DialogueLogEntry[] {
  const global = dialogueLog.filter((line) => isPlayFeedDialogueLine(line, flags));

  if (isForestOpeningPhase(flags)) return global;

  return global.slice(-recentMax);

}



/** World prints for Play (excludes legacy day markers). */

export function worldLinesForPlayFeed(

  worldEventLog: readonly WorldEventLogEntry[],

  _flags: readonly string[],

  recentMax: number

): WorldEventLogEntry[] {

  if (!WORLD_EVENT_PRINTS_ENABLED) return [];

  return worldEventLog

    .slice(-recentMax)

    .filter((entry) => !isPlayDayMarkerText(entry.text));

}



/** Journal recaps on Play — full log during forest opening, recent slice after village. */

export function journalLinesForPlayFeed(

  journalLog: readonly JournalLogEntry[],

  flags: readonly string[],

  recentMax: number

): JournalLogEntry[] {

  if (isForestOpeningPhase(flags)) return [...journalLog];

  return journalLog.slice(-recentMax);

}



/** Latest timestamp across dialogue + world rows (Chronicle / day-report stamping). */

export function getLedgerMaxAtMs(

  dialogueLog: readonly DialogueLogEntry[],

  worldEventLog: readonly WorldEventLogEntry[]

): number {

  let max = 0;

  for (const entry of dialogueLog) {

    if (entry.atMs > max) max = entry.atMs;

  }

  for (const entry of worldEventLog) {

    if (entry.atMs > max) max = entry.atMs;

  }

  return max;

}



/** Latest timestamp across all Play-tab ledger streams (dialogue, world, journal recaps). */

export function getPlayLedgerMaxAtMs(

  dialogueLog: readonly DialogueLogEntry[],

  worldEventLog: readonly WorldEventLogEntry[],

  journalLog: readonly JournalLogEntry[]

): number {

  let max = getLedgerMaxAtMs(dialogueLog, worldEventLog);

  for (const entry of journalLog) {

    if (entry.atMs > max) max = entry.atMs;

  }

  return max;

}



/**

 * Day reports appended on login catch-up must sort after the existing ledger.

 * Play feed merges dialogue + world by `atMs`, not append order.

 */

export type StampDialogueAfterLedgerOptions = {
  minAtMs?: number;
};

export function stampDialogueEntriesAfterLedger(

  entries: readonly DialogueLogEntry[],

  dialogueLog: readonly DialogueLogEntry[],

  worldEventLog: readonly WorldEventLogEntry[],

  journalLog: readonly JournalLogEntry[] = [],

  options?: StampDialogueAfterLedgerOptions

): DialogueLogEntry[] {

  if (entries.length === 0) return [];

  let nextAt = Math.max(

    options?.minAtMs ?? 0,

    Date.now(),

    getPlayLedgerMaxAtMs(dialogueLog, worldEventLog, journalLog) + 1

  );

  return entries.map((line) => {

    const stamped = { ...line, atMs: nextAt };

    nextAt += 1;

    return stamped;

  });

}



/** Monotonic `atMs` for a new journal recap so it sorts after the existing Play ledger. */

export function stampJournalRecapAtMs(

  dialogueLog: readonly DialogueLogEntry[],

  worldEventLog: readonly WorldEventLogEntry[],

  journalLog: readonly JournalLogEntry[]

): number {

  return Math.max(Date.now(), getPlayLedgerMaxAtMs(dialogueLog, worldEventLog, journalLog) + 1);

}


