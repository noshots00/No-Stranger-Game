import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { normalizeQuestState } from '@/components/rpg/quests/engine';
import type { QuestState } from '@/components/rpg/quests/types';

const CHARACTER_START_KIND = 10031;
const CHARACTER_START_D_TAG = 'character-start';
const QUEST_STATE_KIND = 10032;
const QUEST_STATE_D_TAG = 'quest-state';

type NostrClient = {
  query: (filters: NostrFilter[]) => Promise<NostrEvent[]>;
  event: (event: NostrEvent) => Promise<unknown>;
};

type Signer = {
  signEvent: (draft: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>) => Promise<NostrEvent>;
};

function parseStartTimestamp(content: string): number | null {
  try {
    const parsed = JSON.parse(content) as { startTimestamp?: number };
    if (typeof parsed.startTimestamp !== 'number' || Number.isNaN(parsed.startTimestamp)) return null;
    return parsed.startTimestamp;
  } catch {
    return null;
  }
}

type QuestStateSnapshot = {
  savedAtMs: number;
  state: QuestState;
};

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
    (row.atMs === undefined || typeof row.atMs === 'number')
  );
}

function isQuestState(value: unknown): value is QuestState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const worldLogOk =
    !('worldEventLog' in candidate) ||
    (Array.isArray(candidate.worldEventLog) &&
      candidate.worldEventLog.every((line) => isWorldEventLogRow(line)));
  const dialogueOk =
    Array.isArray(candidate.dialogueLog) &&
    candidate.dialogueLog.every((row) => isDialogueLogRow(row));
  return (
    (typeof candidate.activeQuestId === 'string' || candidate.activeQuestId === null) &&
    typeof candidate.progressByQuestId === 'object' &&
    candidate.progressByQuestId !== null &&
    typeof candidate.modifiers === 'object' &&
    candidate.modifiers !== null &&
    Array.isArray(candidate.flags) &&
    typeof candidate.playerName === 'string' &&
    dialogueOk &&
    worldLogOk
  );
}

function parseQuestStateSnapshot(content: string): QuestStateSnapshot | null {
  try {
    const parsed = JSON.parse(content) as { savedAtMs?: number; state?: unknown };
    if (typeof parsed.savedAtMs !== 'number' || Number.isNaN(parsed.savedAtMs)) return null;
    if (!isQuestState(parsed.state)) return null;
    return { savedAtMs: parsed.savedAtMs, state: normalizeQuestState(parsed.state) };
  } catch {
    return null;
  }
}

export async function fetchCharacterStartTimestamp(nostr: NostrClient, pubkey: string): Promise<number | null> {
  const events = await nostr.query([
    {
      kinds: [CHARACTER_START_KIND],
      authors: [pubkey],
      limit: 10,
    },
  ]);

  const matching = events
    .filter((event) => event.tags.some(([name, value]) => name === 'd' && value === CHARACTER_START_D_TAG))
    .sort((a, b) => b.created_at - a.created_at);

  if (matching.length === 0) return null;
  return parseStartTimestamp(matching[0].content);
}

export async function publishCharacterStartTimestamp(
  nostr: NostrClient,
  signer: Signer,
  timestampMs: number
): Promise<number> {
  const draft = {
    kind: CHARACTER_START_KIND,
    content: JSON.stringify({ startTimestamp: timestampMs }),
    tags: [
      ['d', CHARACTER_START_D_TAG],
      ['t', 'no-stranger-game'],
      ['alt', 'Character start timestamp for No Stranger Game day counter'],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };

  const event = await signer.signEvent(draft);
  await nostr.event(event);
  return timestampMs;
}

export async function fetchOrCreateCharacterStartTimestamp(
  nostr: NostrClient,
  pubkey: string,
  signer: Signer
): Promise<number> {
  const existing = await fetchCharacterStartTimestamp(nostr, pubkey);
  if (existing) return existing;
  const timestampMs = Date.now();
  return publishCharacterStartTimestamp(nostr, signer, timestampMs);
}

export async function fetchQuestStateSnapshot(
  nostr: NostrClient,
  pubkey: string
): Promise<QuestStateSnapshot | null> {
  const events = await nostr.query([
    {
      kinds: [QUEST_STATE_KIND],
      authors: [pubkey],
      limit: 10,
    },
  ]);

  const matching = events
    .filter((event) => event.tags.some(([name, value]) => name === 'd' && value === QUEST_STATE_D_TAG))
    .sort((a, b) => b.created_at - a.created_at);

  if (matching.length === 0) return null;
  return parseQuestStateSnapshot(matching[0].content);
}

export async function publishQuestStateSnapshot(
  nostr: NostrClient,
  signer: Signer,
  state: QuestState
): Promise<number> {
  const savedAtMs = Date.now();
  const draft = {
    kind: QUEST_STATE_KIND,
    content: JSON.stringify({ savedAtMs, state }),
    tags: [
      ['d', QUEST_STATE_D_TAG],
      ['t', 'no-stranger-game'],
      ['alt', 'Quest state checkpoint for No Stranger Game'],
    ],
    created_at: Math.floor(savedAtMs / 1000),
  };

  const event = await signer.signEvent(draft);
  await nostr.event(event);
  return savedAtMs;
}
