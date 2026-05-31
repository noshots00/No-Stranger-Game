/**

 * Play tab ledger vs. quest module (forest opening → village).

 *

 * **Forest opening** (until `village-phase`): the main quest line is fully scripted. The Play

 * screen is two layers:

 * - **Ledger (permanent):** `journalLog` recaps, day reports in global `dialogueLog`, world

 *   "prints" (milestones, boar, etc.). No recent-window truncation — the opening arc is short.

 * - **Quest module (interactive):** quest cards on the journal; tap opens Quest Scene.

 *   Quest-scoped lines stay on `sourceQuestId` for Chronicle; journal shows recaps.

 *

 * **Day pacing UI:** header day counter + Day N Report blocks in `dialogueLog` (no `Day N...`

 * world prints).

 */



import { WORLD_EVENT_PRINTS_ENABLED } from './constants';
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



/** Global dialogue rows for the Play story stream (excludes active-quest transcript). */

export function dialogueLinesForPlayFeed(

  dialogueLog: readonly DialogueLogEntry[],

  flags: readonly string[],

  recentMax: number

): DialogueLogEntry[] {

  const global = dialogueLog.filter((line) => !line.sourceQuestId);

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


