import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { formatInTimeZone } from 'date-fns-tz';
import { normalizeQuestState } from '@/components/rpg/quests/engine';
import { canPersistQuestCheckpoint } from '@/components/rpg/quests/questSaveGuard';
import type { QuestState } from '@/components/rpg/quests/types';
import { EASTERN_GAME_TIMEZONE } from '@/lib/easternGameTime';
import { publishGameRelayEvent, type GameRelayEventPool } from '@/lib/publishGameRelayEvent';

/**
 * Kind 10031 — character creation anchor for No Stranger Game.
 *
 * `creationDateEastern` is the canonical pacing key (America/New_York calendar date at name submit).
 * `startTimestamp` / `signedAtMs` support future anti-cheat (account-age bounds); game logic uses only the date.
 */
const CHARACTER_START_KIND = 10031;
const CHARACTER_START_D_TAG = 'character-start';
/** Published quest checkpoint kind (see `publishQuestStateSnapshot`). */
export const NSG_QUEST_STATE_KIND = 10032;
export const NSG_QUEST_STATE_D_TAG = 'quest-state';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

type NostrClient = GameRelayEventPool & {
  query: (filters: NostrFilter[], opts?: { signal?: AbortSignal }) => Promise<NostrEvent[]>;
};

type Signer = {
  signEvent: (draft: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => Promise<NostrEvent>;
};

export type CharacterCreationPayload = {
  creationDateEastern: string;
  /** Legacy-only: derive Eastern date if `creationDateEastern` absent. */
  startTimestamp?: number;
  /** When this record was signed (audit / future verification). */
  signedAtMs?: number;
};

export type QuestCheckpointPayload = {
  savedAtMs: number;
  state: QuestState;
};

/** One kind 10032 row from relays (immutable history; newest wins on normal login). */
export type QuestCheckpointRecord = {
  eventId: string;
  createdAtUnix: number;
  savedAtMs: number;
  state: QuestState;
};

function parseCharacterCreationPayload(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as CharacterCreationPayload;
    if (typeof parsed.creationDateEastern === 'string' && YMD_RE.test(parsed.creationDateEastern)) {
      return parsed.creationDateEastern;
    }
    if (typeof parsed.startTimestamp === 'number' && !Number.isNaN(parsed.startTimestamp)) {
      return formatInTimeZone(parsed.startTimestamp, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
    }
  } catch {
    return null;
  }
  return null;
}

function isWorldEventLogRow(value: unknown): boolean {
  if (typeof value === 'string') return true;
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.text === 'string';
}

function isDialogueLogRow(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.speaker === 'string' &&
    typeof row.text === 'string' &&
    (row.atMs === undefined || typeof row.atMs === 'number') &&
    (row.sourceQuestId === undefined || typeof row.sourceQuestId === 'string')
  );
}

function isJournalLogRow(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  const rewardsOk =
    row.completionRewards === undefined ||
    (Array.isArray(row.completionRewards) &&
      row.completionRewards.every((x) => typeof x === 'string'));
  return (
    typeof row.id === 'string' &&
    typeof row.questId === 'string' &&
    typeof row.text === 'string' &&
    typeof row.atMs === 'number' &&
    rewardsOk
  );
}

function isQuestState(value: unknown): value is QuestState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const worldLogOk =
    !('worldEventLog' in candidate) ||
    (Array.isArray(candidate.worldEventLog) &&
      candidate.worldEventLog.every((line) => isWorldEventLogRow(line)));
  const journalLogOk =
    !('journalLog' in candidate) ||
    (Array.isArray(candidate.journalLog) && candidate.journalLog.every((row) => isJournalLogRow(row)));
  const dialogueOk =
    Array.isArray(candidate.dialogueLog) &&
    candidate.dialogueLog.every((row) => isDialogueLogRow(row));
  const assignedRaceOk =
    !('assignedRaceSlug' in candidate) ||
    candidate.assignedRaceSlug === null ||
    typeof candidate.assignedRaceSlug === 'string';
  const lockedClassOk =
    !('lockedClassSlug' in candidate) ||
    candidate.lockedClassSlug === null ||
    typeof candidate.lockedClassSlug === 'string';

  return (
    (typeof candidate.activeQuestId === 'string' || candidate.activeQuestId === null) &&
    typeof candidate.progressByQuestId === 'object' &&
    candidate.progressByQuestId !== null &&
    typeof candidate.modifiers === 'object' &&
    candidate.modifiers !== null &&
    Array.isArray(candidate.flags) &&
    typeof candidate.playerName === 'string' &&
    assignedRaceOk &&
    lockedClassOk &&
    dialogueOk &&
    worldLogOk &&
    journalLogOk
  );
}

function parseQuestStateSnapshot(content: string): QuestCheckpointPayload | null {
  try {
    const parsed = JSON.parse(content) as { savedAtMs?: number; state?: unknown };
    if (typeof parsed.savedAtMs !== 'number' || Number.isNaN(parsed.savedAtMs)) return null;
    if (!isQuestState(parsed.state)) return null;
    return { savedAtMs: parsed.savedAtMs, state: normalizeQuestState(parsed.state) };
  } catch {
    return null;
  }
}

/** Parse JSON payload from a published quest checkpoint event (`kind` 10032). */
export function parseQuestCheckpointPayload(content: string): QuestCheckpointPayload | null {
  return parseQuestStateSnapshot(content);
}

export function parseQuestCheckpointEvent(event: NostrEvent): QuestCheckpointRecord | null {
  const payload = parseQuestStateSnapshot(event.content);
  if (!payload) return null;
  const savedAtMs =
    payload.savedAtMs > 0 ? payload.savedAtMs : Math.max(0, event.created_at) * 1000;
  return {
    eventId: event.id,
    createdAtUnix: event.created_at,
    savedAtMs,
    state: payload.state,
  };
}

export function formatQuestCheckpointSavedAt(savedAtMs: number): string {
  return formatInTimeZone(savedAtMs, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd h:mm a zzz');
}

/** Display day from checkpoint state (matches in-game header during forest / paced village). */
export function questCheckpointDisplayDay(state: QuestState): number {
  return Math.max(1, Math.floor(state.lastDailyXpDay));
}

/** Latest character creation Eastern date from relays (newest event wins for current playthrough). */
export async function fetchCharacterCreationDateFromRelay(
  nostr: NostrClient,
  pubkey: string
): Promise<string | null> {
  const events = await nostr.query([
    {
      kinds: [CHARACTER_START_KIND],
      authors: [pubkey],
      limit: 25,
    },
  ]);

  const matching = events
    .filter((event) => event.tags.some(([name, value]) => name === 'd' && value === CHARACTER_START_D_TAG))
    .sort((a, b) => b.created_at - a.created_at);

  for (const ev of matching) {
    const ymd = parseCharacterCreationPayload(ev.content);
    if (ymd) return ymd;
  }
  return null;
}

/** Publish immutable creation record (call when player submits name on origin quest). */
export async function publishCharacterCreation(
  nostr: NostrClient,
  signer: Signer,
  creationDateEastern: string
): Promise<void> {
  const signedAtMs = Date.now();
  const draft = {
    kind: CHARACTER_START_KIND,
    content: JSON.stringify({
      creationDateEastern,
      startTimestamp: signedAtMs,
      signedAtMs,
    } satisfies CharacterCreationPayload),
    tags: [
      ['d', CHARACTER_START_D_TAG],
      ['t', 'no-stranger-game'],
      ['alt', 'Character creation (Eastern date) for No Stranger Game'],
    ],
    created_at: Math.floor(signedAtMs / 1000),
  };

  const event = await signer.signEvent(draft);
  await publishGameRelayEvent(nostr, event);
}

/**
 * If relays have no kind 10031 but checkpoint/local state has a creation date, republish so other clients/relays match.
 */
export async function repairCharacterCreationOnRelay(
  nostr: NostrClient,
  signer: Signer,
  creationDateEastern: string
): Promise<void> {
  await publishCharacterCreation(nostr, signer, creationDateEastern);
}

export async function fetchQuestStateSnapshot(
  nostr: NostrClient,
  pubkey: string
): Promise<QuestCheckpointPayload | null> {
  const events = await nostr.query([
    {
      kinds: [NSG_QUEST_STATE_KIND],
      authors: [pubkey],
      limit: 10,
    },
  ]);

  const matching = events
    .filter((event) => event.tags.some(([name, value]) => name === 'd' && value === NSG_QUEST_STATE_D_TAG))
    .sort((a, b) => b.created_at - a.created_at);

  if (matching.length === 0) return null;
  return parseQuestStateSnapshot(matching[0].content);
}

/** All quest checkpoints for a pubkey (newest first). Kind 10032 events are not replaced — history accumulates. */
export async function fetchAllQuestStateCheckpoints(
  nostr: NostrClient,
  pubkey: string,
  limit = 100
): Promise<QuestCheckpointRecord[]> {
  const events = await nostr.query([
    {
      kinds: [NSG_QUEST_STATE_KIND],
      authors: [pubkey],
      limit,
    },
  ]);

  return events
    .filter((event) => event.tags.some(([name, value]) => name === 'd' && value === NSG_QUEST_STATE_D_TAG))
    .map((event) => parseQuestCheckpointEvent(event))
    .filter((row): row is QuestCheckpointRecord => row !== null)
    .sort((a, b) => b.savedAtMs - a.savedAtMs || b.createdAtUnix - a.createdAtUnix);
}

export async function publishQuestStateSnapshot(
  nostr: NostrClient,
  signer: Signer,
  state: QuestState
): Promise<number> {
  if (!canPersistQuestCheckpoint(state)) {
    console.warn('Skipped quest checkpoint publish: character has no name yet.');
    return 0;
  }
  const savedAtMs = Date.now();
  const draft = {
    kind: NSG_QUEST_STATE_KIND,
    content: JSON.stringify({ savedAtMs, state }),
    tags: [
      ['d', NSG_QUEST_STATE_D_TAG],
      ['t', 'no-stranger-game'],
      ['alt', 'Quest state checkpoint for No Stranger Game'],
    ],
    created_at: Math.floor(savedAtMs / 1000),
  };

  const event = await signer.signEvent(draft);
  await publishGameRelayEvent(nostr, event);
  return savedAtMs;
}

/**
 * Merge character name into Kind 0 profile JSON (preserves picture, about, etc.)
 * so Ditto and other clients show the same label as in-game chat.
 */
export async function publishMergedProfileDisplayName(
  nostr: NostrClient,
  signer: Signer,
  pubkey: string,
  displayName: string
): Promise<void> {
  const trimmed = displayName.trim();
  if (!trimmed) return;

  const [existing] = await nostr.query([{ kinds: [0], authors: [pubkey], limit: 1 }]);

  const base: Record<string, string> = {};
  if (existing?.content) {
    try {
      const parsed = JSON.parse(existing.content) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') base[k] = v;
      }
    } catch {
      // leave base empty
    }
  }

  base.name = trimmed;
  base.display_name = trimmed;

  const draft = {
    kind: 0,
    content: JSON.stringify(base),
    tags: [] as string[][],
    created_at: Math.floor(Date.now() / 1000),
  };

  const event = await signer.signEvent(draft);
  await publishGameRelayEvent(nostr, event);
}
