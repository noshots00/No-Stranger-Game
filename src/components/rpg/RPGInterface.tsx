import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  applyChoice,
  createInitialQuestState,
  getCharacterLevel,
  getLevelFromXp,
  getCompletedQuestIds,
  getCurrentStep,
  getQuestContext,
  getSkillLevelUpLines,
  getVisibleQuests,
  interpolateStepText,
  normalizeQuestState,
  startQuest,
  submitPlayerName,
} from '@/components/rpg/quests/engine';
import { SKILL_SHEET_LABEL, SKILL_XP_KEYS, SKILLS_WITH_DAILY_XP } from '@/components/rpg/quests/skills-config';
import { allQuests, questById } from '@/components/rpg/quests/registry';
import {
  fetchOrCreateCharacterStartTimestamp,
  fetchQuestStateSnapshot,
  publishCharacterStartTimestamp,
  publishQuestStateSnapshot,
} from '@/components/rpg/gameProfile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import {
  extractFollowPubkeysFromContactList,
  NSG_SOCIAL_FEED_T,
  NSG_SOCIAL_LOBBY_T,
  NSG_SOCIAL_SIGNAL_T,
  parsePinnedNoteIdsFromEnv,
  truncatePlaintext,
} from '@/components/rpg/social/socialTags';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DialogueLogEntry, QuestState, WorldEventLogEntry } from '@/components/rpg/quests/types';

const INTRO_DEV_MESSAGE = `Welcome to No Stranger Game! Your character is autonomous! He will act according to his own needs and desires. The primary means of progressing the game is by completing quests. Every choice has a permanent and irrevocable impact on the trajectory of your character, tread CAREFULLY! The game is designed to take about three minutes of your time each day. Be patient... it may seem like nothing is happening... but the game is MASSIVE and changes take place over Days, not seconds. For now your character will explore the forest around him, seeking food and shelter. Soon he will discover a village, which will unlock the next part of the Main Quest. The forest is very large, and your character may discover other locales before the village, and it could take longer than you are anticipating. I recommend you take a few minutes to look around the game, and then check your character's progress tomorrow.

If you have any questions please reach out to me on Nostr.

Thank you for playing!`;

const SILVER_LAKE_FLAG = 'silver-lake-unlocked';

const locationActions: Record<string, string[]> = {
  Town: ['Visit the tavern', 'Visit the market'],
  Forest: ['Interact with the old well', 'Visit the abandoned cabin'],
  'Silver Lake': [],
};
const HIDDEN_LOCATION_ACTIONS = new Set([
  'Interact with the old well',
  'Visit the abandoned cabin',
]);

const characterStats = [
  ['Strength', '1'],
  ['Dexterity', '1'],
  ['Constitution', '1'],
  ['Intelligence', '1'],
  ['Wisdom', '1'],
  ['Charisma', '1'],
];

const _characterSkills: string[] = [];
const _characterTraits: string[] = [];
const _characterRelationships: string[] = [];
const _characterAffinities: string[] = [];
const _characterAfflictions: string[] = [];
const _characterBlessings: string[] = [];
const _characterCurses: string[] = [];

type MobileTab = 'character' | 'quests' | 'play' | 'map' | 'social';
const QUEST_STATE_STORAGE_KEY = 'nsg:facsimile-quest-state';
const CHARACTER_START_TS_STORAGE_KEY = 'nsg:character-start-timestamp';
const DEV_DAY_OFFSET_STORAGE_KEY = 'nsg:dev-day-offset-ms';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DAILY_XP = 1440;
const NPC_AVATAR_URL = 'https://api.dicebear.com/8.x/adventurer/svg?seed=Elira';
const CLASS_UNLOCK_POINTS = 5;
const CHARACTER_START_KIND = 10031;
const CHARACTER_START_D_TAG = 'character-start';
const FOLLOW_LIST_KIND = 3;
const GOLD_MODIFIER_KEYS = ['Gold', 'gold', 'Coins', 'coins'] as const;
const HIDDEN_CLASS_MODIFIER_KEYS = ['WarriorClass', 'MageClass', 'RogueClass'] as const;
const PRIMARY_STAT_MODIFIER_LABEL: Record<string, string> = {
  Strength: 'strength',
  Dexterity: 'dexterity',
  Constitution: 'constitution',
  Intelligence: 'intelligence',
  Wisdom: 'wisdom',
  Charisma: 'charisma',
};
const PLAY_DIALOGUE_RECENT_MAX = 120;
const PLAY_WORLD_RECENT_MAX = 40;
const DIALOGUE_SCROLL_PIN_EPS = 80;
const DIALOGUE_BREATHE_OVERFLOW_RATIO = 1.3;

const appendUniqueWorldEntries = (
  existing: WorldEventLogEntry[],
  texts: string[],
  baseAtMs = Date.now()
): WorldEventLogEntry[] => {
  if (texts.length === 0) return existing;
  const seen = new Set(existing.map((e) => e.text));
  const next = [...existing];
  let offset = 0;
  for (const text of texts) {
    if (seen.has(text)) continue;
    seen.add(text);
    next.push({ text, atMs: baseAtMs + offset });
    offset += 1;
  }
  return next;
};

const getGoldFromModifiers = (modifiers: Record<string, number>): number =>
  GOLD_MODIFIER_KEYS.reduce((total, key) => total + (modifiers[key] ?? 0), 0);

const isItemModifierKey = (key: string): boolean => /^(item|items|inventory)[:_-]/i.test(key);

type ModifierMessageKind = 'hidden_class' | 'primary_stat' | 'other';

// Extension point: future categories (relationships/affinities/etc.) can branch here
// without rewriting modifier world-event generation.
const getModifierMessageKind = (key: string): ModifierMessageKind => {
  if (HIDDEN_CLASS_MODIFIER_KEYS.includes(key as typeof HIDDEN_CLASS_MODIFIER_KEYS[number])) {
    return 'hidden_class';
  }
  if (PRIMARY_STAT_MODIFIER_LABEL[key]) {
    return 'primary_stat';
  }
  return 'other';
};

const toItemLabel = (key: string): string =>
  key
    .replace(/^(item|items|inventory)[:_-]?/i, '')
    .replace(/[_-]/g, ' ')
    .trim() || 'supplies';

const getRewardLines = (
  prevModifiers: Record<string, number>,
  nextModifiers: Record<string, number>
): string[] => {
  const rewardLines: string[] = [];
  const goldDelta = getGoldFromModifiers(nextModifiers) - getGoldFromModifiers(prevModifiers);
  if (goldDelta > 0) {
    rewardLines.push(`You gained ${goldDelta} gold.`);
  }

  const itemLines = Object.keys(nextModifiers)
    .filter((key) => isItemModifierKey(key))
    .map((key) => {
      const previous = prevModifiers[key] ?? 0;
      const current = nextModifiers[key] ?? 0;
      const delta = current - previous;
      if (delta <= 0) return null;
      return `You found ${delta} ${toItemLabel(key)}.`;
    })
    .filter((line): line is string => Boolean(line));

  return [...rewardLines, ...itemLines];
};

const getModifierLevelUpLines = (prevState: QuestState, nextState: QuestState): string[] => {
  const lines: string[] = [];

  Object.keys(nextState.modifiers).forEach((key) => {
    if (isItemModifierKey(key) || GOLD_MODIFIER_KEYS.includes(key as typeof GOLD_MODIFIER_KEYS[number])) return;
    const kind = getModifierMessageKind(key);
    if (kind === 'hidden_class') return;
    const previous = prevState.modifiers[key] ?? 0;
    const current = nextState.modifiers[key] ?? 0;
    const delta = current - previous;
    if (delta <= 0) return;

    if (kind === 'primary_stat') {
      lines.push(`You gain ${delta} ${PRIMARY_STAT_MODIFIER_LABEL[key]}!`);
    }
  });

  return lines;
};

const getLevelUpLines = (prevState: QuestState, nextState: QuestState): string[] => [
  ...getSkillLevelUpLines(prevState, nextState),
  ...getModifierLevelUpLines(prevState, nextState),
];

/** Dialogue speaker for lines generated from the player's choice (not "You:" colon style). */
const PLAYER_ACTION_SPEAKER = 'PlayerAction';
const QUEST_DIVIDER_SPEAKER = 'QuestDivider';

const IMPERATIVE_VERB_THIRD: Record<string, string> = {
  strike: 'strikes',
  cast: 'casts',
  try: 'tries',
  run: 'runs',
  draw: 'draws',
  hide: 'hides',
  jump: 'jumps',
  duck: 'ducks',
  dodge: 'dodges',
  go: 'goes',
};

const imperativePhraseToThirdPerson = (phrase: string): string => {
  const trimmed = phrase.trim();
  if (!trimmed) return 'acts';
  const withoutBang = trimmed.replace(/!+\s*$/, '');
  const m = withoutBang.match(/^([A-Za-z]+)([\s\S]*)$/);
  if (!m) return `${withoutBang}`;
  const verb = m[1].toLowerCase();
  const rest = m[2];
  const irregular = IMPERATIVE_VERB_THIRD[verb];
  if (irregular) return `${irregular}${rest}`;
  if (/[sxz]$|ch$|sh$/i.test(verb)) return `${verb}es${rest}`;
  if (/[^aeiou]y$/i.test(verb)) return `${verb.slice(0, -1)}ies${rest}`;
  return `${verb}s${rest}`;
};

const isChoiceQuestionLike = (label: string): boolean => {
  const t = label.trim().toLowerCase();
  const first = t.split(/\s+/)[0] ?? '';
  return ['who', 'what', 'where', 'when', 'why', 'how'].includes(first) || /\b(i|me|my)\b/.test(t);
};

/** Narrates the player's selected choice using their character name (third person for actions). */
const formatPlayerChoiceDialogueLine = (playerName: string, label: string): string => {
  const displayName = playerName.trim() || 'Stranger';
  const raw = label.trim().replace(/!+\s*$/, '');
  if (!raw) return `${displayName} acts!`;

  if (isChoiceQuestionLike(raw)) {
    const quoted = raw.endsWith('?') ? raw : `${raw}?`;
    return quoted.charAt(0).toUpperCase() + quoted.slice(1);
  }

  const action = imperativePhraseToThirdPerson(raw);
  return `${displayName} ${action}!`;
};

const DIALOGUE_NARRATOR_CLASSES =
  'font-serif text-[0.9375rem] leading-relaxed tracking-wide italic text-[var(--facsimile-narrator-ink)]';

/** Play tab: matches choice scale (text-xs) for parity with facsimile choices. */
const DIALOGUE_NARRATOR_PLAY_CLASSES =
  'font-sans text-xs leading-relaxed tracking-wide text-[var(--facsimile-narrator-ink)]';

const DIALOGUE_PLAYER_BODY_CLASSES =
  'font-sans text-sm font-semibold leading-6 text-[var(--facsimile-player-ink)]';

const DIALOGUE_PLAYER_BODY_PLAY_CLASSES =
  'font-sans text-xs font-semibold leading-relaxed text-[var(--facsimile-player-ink)]';

const DIALOGUE_DEV_MESSAGE_CLASSES =
  'rounded-md border border-cyan-300/55 bg-cyan-950/35 px-2 py-1 text-sm leading-6 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]';

type DialogueVoice = 'narrator' | 'dev' | 'player' | 'divider';

type DialogueVoiceBlockModel = {
  role: DialogueVoice;
  lines: DialogueLogEntry[];
};

type ChronicleMergedRow =
  | { kind: 'dialogue'; atMs: number; id: string; speaker: string; text: string }
  | { kind: 'world'; atMs: number; text: string };

type ChronicleSegment =
  | { type: 'world'; row: Extract<ChronicleMergedRow, { kind: 'world' }> }
  | { type: 'dialogueBlock'; role: DialogueVoice; lines: DialogueLogEntry[] };

const dialogueVoiceRole = (speaker: string): DialogueVoice => {
  if (speaker === 'Narrator') return 'narrator';
  if (speaker === 'Dev Message') return 'dev';
  if (speaker === QUEST_DIVIDER_SPEAKER) return 'divider';
  return 'player';
};

const groupDialogueLinesByVoice = (lines: DialogueLogEntry[]): DialogueVoiceBlockModel[] => {
  if (lines.length === 0) return [];
  const blocks: DialogueVoiceBlockModel[] = [];
  for (const line of lines) {
    const role = dialogueVoiceRole(line.speaker);
    const last = blocks[blocks.length - 1];
    if (last && last.role === role) {
      last.lines.push(line);
    } else {
      blocks.push({ role, lines: [line] });
    }
  }
  return blocks;
};

const groupChronicleRows = (sortedRows: ChronicleMergedRow[]): ChronicleSegment[] => {
  const out: ChronicleSegment[] = [];
  let i = 0;
  while (i < sortedRows.length) {
    const row = sortedRows[i];
    if (row.kind === 'world') {
      out.push({ type: 'world', row });
      i += 1;
      continue;
    }
    const role = dialogueVoiceRole(row.speaker);
    const lines: DialogueLogEntry[] = [];
    while (i < sortedRows.length && sortedRows[i].kind === 'dialogue') {
      const d = sortedRows[i] as Extract<ChronicleMergedRow, { kind: 'dialogue' }>;
      if (dialogueVoiceRole(d.speaker) !== role) break;
      lines.push({
        id: d.id,
        speaker: d.speaker,
        text: d.text,
        atMs: d.atMs,
      });
      i += 1;
    }
    out.push({ type: 'dialogueBlock', role, lines });
  }
  return out;
};

function DialogueVoiceBlock({
  role,
  lines,
  presentation = 'chronicle',
}: {
  role: DialogueVoice;
  lines: DialogueLogEntry[];
  presentation?: 'play' | 'chronicle';
}) {
  const narratorClasses =
    presentation === 'play' ? DIALOGUE_NARRATOR_PLAY_CLASSES : DIALOGUE_NARRATOR_CLASSES;
  const playerBodyClasses =
    presentation === 'play' ? DIALOGUE_PLAYER_BODY_PLAY_CLASSES : DIALOGUE_PLAYER_BODY_CLASSES;

  if (role === 'narrator') {
    return (
      <div className="py-0.5">
        <div className="space-y-1.5">
          {lines.map((line) => (
            <p key={line.id} className={narratorClasses}>
              {line.text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (role === 'dev') {
    return (
      <div className="space-y-1.5 py-0.5">
        {lines.map((line) => (
          <p key={line.id} className={DIALOGUE_DEV_MESSAGE_CLASSES}>
            {line.text}
          </p>
        ))}
      </div>
    );
  }

  if (role === 'divider') {
    return (
      <div className="py-1.5">
        <div className="mx-auto h-px w-[88%] bg-[var(--facsimile-panel-border)]/70" />
      </div>
    );
  }

  const playerShellClass =
    presentation === 'play'
      ? 'ml-auto w-[min(92%,22rem)] rounded-lg bg-[rgba(255,255,255,0.045)] px-3 py-2 ring-1 ring-[var(--facsimile-player-ink)]/15'
      : 'ml-auto w-[min(92%,22rem)] rounded-lg border border-[var(--facsimile-player-ink)]/40 bg-[rgba(0,0,0,0.45)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

  return (
    <div className={playerShellClass}>
      <div className="space-y-1.5">
        {lines.map((line) => (
          <div key={line.id}>
            {line.speaker === PLAYER_ACTION_SPEAKER || line.speaker === 'You' ? (
              <p className={playerBodyClasses}>{line.text}</p>
            ) : (
              <p className={playerBodyClasses}>
                <span className="font-medium text-[var(--facsimile-player-label)]">{line.speaker}: </span>
                {line.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const getCharacterClass = (modifiers: Record<string, number>): 'Warrior' | 'Rogue' | 'Mage' | 'Stranger' => {
  const classScores: Array<{ name: 'Warrior' | 'Rogue' | 'Mage'; score: number }> = [
    { name: 'Warrior', score: modifiers.WarriorClass ?? 0 },
    { name: 'Rogue', score: modifiers.RogueClass ?? 0 },
    { name: 'Mage', score: modifiers.MageClass ?? 0 },
  ];

  const unlocked = classScores.filter((entry) => entry.score >= CLASS_UNLOCK_POINTS);
  if (unlocked.length === 0) return 'Stranger';
  return unlocked.sort((a, b) => b.score - a.score)[0].name;
};

export function RPGInterface() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutate: publishNostrEvent, isPending: isLobbySendPending } = useNostrPublish();
  const { logout } = useLoginActions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MobileTab>('play');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [questState, setQuestState] = useState(createInitialQuestState);
  const [nameInput, setNameInput] = useState('');
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [isQuestStateHydrated, setIsQuestStateHydrated] = useState(false);
  const [characterStartTimestamp, setCharacterStartTimestamp] = useState<number | null>(null);
  const [devDayOffsetMs, setDevDayOffsetMs] = useState(0);
  const dialogueScrollRef = useRef<HTMLDivElement | null>(null);
  const eventLogScrollRef = useRef<HTMLDivElement | null>(null);
  const dialoguePinnedRef = useRef(true);
  const dialogueInstantScrollRef = useRef(false);
  const prevDialogueOverflowRatioRef = useRef<number | null>(null);
  const completedQuestCountRef = useRef(0);
  const [isChronicleOpen, setIsChronicleOpen] = useState(false);
  const [lobbyInput, setLobbyInput] = useState('');
  const [lobbyError, setLobbyError] = useState<string | null>(null);

  const pinnedSignalIdsKey = useMemo(() => parsePinnedNoteIdsFromEnv().join('|'), []);

  const handleDialogueScroll = () => {
    const el = dialogueScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      dialoguePinnedRef.current = true;
      return;
    }
    dialoguePinnedRef.current = el.scrollTop >= maxScroll - DIALOGUE_SCROLL_PIN_EPS;
  };

  const questStateStorageKey = user ? `${QUEST_STATE_STORAGE_KEY}:${user.pubkey}` : QUEST_STATE_STORAGE_KEY;
  const socialQuery = useQuery({
    queryKey: ['rpg-social-presence', user?.pubkey ?? 'anonymous'],
    enabled: Boolean(user),
    queryFn: async () => {
      const loginEvents = await nostr.query([
        {
          kinds: [CHARACTER_START_KIND],
          '#d': [CHARACTER_START_D_TAG],
          '#t': ['no-stranger-game'],
          limit: 200,
        },
      ]);

      const playerPubkeys = Array.from(new Set(loginEvents.map((event) => event.pubkey)));
      if (!user?.pubkey || playerPubkeys.length === 0) {
        return {
          totalPlayers: playerPubkeys.length,
          kindredSpirits: 0,
        };
      }

      const contactListEvents = await nostr.query([
        {
          kinds: [FOLLOW_LIST_KIND],
          authors: Array.from(new Set([user.pubkey, ...playerPubkeys])),
          limit: Math.max(20, playerPubkeys.length + 5),
        },
      ]);

      const latestByAuthor = new Map<string, NostrEvent>();
      contactListEvents.forEach((event) => {
        const existing = latestByAuthor.get(event.pubkey);
        if (!existing || event.created_at > existing.created_at) {
          latestByAuthor.set(event.pubkey, event);
        }
      });

      const myFollows = extractFollowPubkeysFromContactList(latestByAuthor.get(user.pubkey));
      const kindredSpirits = playerPubkeys.filter((pubkey) => {
        if (pubkey === user.pubkey) return false;
        if (!myFollows.has(pubkey)) return false;
        const theirFollows = extractFollowPubkeysFromContactList(latestByAuthor.get(pubkey));
        return theirFollows.has(user.pubkey);
      }).length;

      return {
        totalPlayers: playerPubkeys.length,
        kindredSpirits,
      };
    },
    staleTime: 60_000,
  });
  const socialStats = socialQuery.data ?? {
    totalPlayers: 0,
    kindredSpirits: 0,
  };

  const socialFeedQuery = useQuery({
    queryKey: ['rpg-social-feed', user?.pubkey ?? '', NSG_SOCIAL_FEED_T],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) return [];
      const contactLists = await nostr.query([
        { kinds: [FOLLOW_LIST_KIND], authors: [user.pubkey], limit: 20 },
      ]);
      const myContact = contactLists.sort((a, b) => b.created_at - a.created_at)[0];
      const myFollows = extractFollowPubkeysFromContactList(myContact);
      if (myFollows.size === 0) return [];
      const notes = await nostr.query([{ kinds: [1], '#t': [NSG_SOCIAL_FEED_T], limit: 200 }]);
      return notes
        .filter((event) => myFollows.has(event.pubkey))
        .sort((a, b) => b.created_at - a.created_at);
    },
  });

  const socialSignalsQuery = useQuery({
    queryKey: ['rpg-social-signals', NSG_SOCIAL_SIGNAL_T, pinnedSignalIdsKey],
    staleTime: 60_000,
    queryFn: async () => {
      const ids = parsePinnedNoteIdsFromEnv();
      const pinned: NostrEvent[] = [];
      for (const id of ids) {
        const rows = await nostr.query([{ kinds: [1], ids: [id], limit: 1 }]);
        if (rows[0]) pinned.push(rows[0]);
      }
      const latest = await nostr.query([{ kinds: [1], '#t': [NSG_SOCIAL_SIGNAL_T], limit: 100 }]);
      const pinSet = new Set(ids);
      const pinnedOrdered = ids
        .map((id) => pinned.find((event) => event.id === id))
        .filter((event): event is NostrEvent => Boolean(event));
      const rest = latest
        .filter((event) => !pinSet.has(event.id))
        .sort((a, b) => b.created_at - a.created_at);
      return { pinned: pinnedOrdered, latest: rest };
    },
  });

  const socialLobbyQuery = useQuery({
    queryKey: ['rpg-social-lobby', NSG_SOCIAL_LOBBY_T],
    staleTime: 30_000,
    queryFn: async () => {
      const rows = await nostr.query([{ kinds: [1], '#t': [NSG_SOCIAL_LOBBY_T], limit: 150 }]);
      return rows.sort((a, b) => a.created_at - b.created_at);
    },
  });

  const handleLobbySend = () => {
    if (!user) return;
    const trimmed = lobbyInput.trim();
    if (!trimmed) {
      setLobbyError('Message cannot be empty.');
      return;
    }
    if (trimmed.length > 4000) {
      setLobbyError('Message is too long.');
      return;
    }
    setLobbyError(null);
    publishNostrEvent(
      { kind: 1, content: trimmed, tags: [['t', NSG_SOCIAL_LOBBY_T]] },
      {
        onSuccess: () => {
          setLobbyInput('');
          void queryClient.invalidateQueries({ queryKey: ['rpg-social-lobby', NSG_SOCIAL_LOBBY_T] });
        },
        onError: (error: unknown) => {
          setLobbyError(error instanceof Error ? error.message : 'Failed to send.');
        },
      }
    );
  };

  useEffect(() => {
    let cancelled = false;
    setIsQuestStateHydrated(false);

    const loadQuestState = async () => {
      if (user) {
        try {
          const snapshot = await fetchQuestStateSnapshot(nostr, user.pubkey);
          if (!cancelled && snapshot?.state) {
            setQuestState(normalizeQuestState(snapshot.state));
            setIsQuestStateHydrated(true);
            return;
          }
        } catch (error) {
          console.warn('Failed to load quest checkpoint from Nostr, using local fallback.', error);
        }
      }

      try {
        const raw = localStorage.getItem(questStateStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (!cancelled) {
              setQuestState(normalizeQuestState(parsed as Partial<typeof questState>));
              setIsQuestStateHydrated(true);
            }
            return;
          }
        }
      } catch {
        setQuestState(createInitialQuestState());
      }

      if (!cancelled) {
        setQuestState(createInitialQuestState());
        setIsQuestStateHydrated(true);
      }
    };

    void loadQuestState();

    return () => {
      cancelled = true;
    };
  }, [nostr, questStateStorageKey, user]);

  useEffect(() => {
    if (!isQuestStateHydrated) return;
    localStorage.setItem(questStateStorageKey, JSON.stringify(questState));
  }, [isQuestStateHydrated, questState, questStateStorageKey]);

  useEffect(() => {
    const raw = localStorage.getItem(DEV_DAY_OFFSET_STORAGE_KEY);
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      setDevDayOffsetMs(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_DAY_OFFSET_STORAGE_KEY, String(devDayOffsetMs));
  }, [devDayOffsetMs]);

  useEffect(() => {
    let cancelled = false;

    const loadStartTimestamp = async () => {
      try {
        if (user) {
          const startTimestamp = await fetchOrCreateCharacterStartTimestamp(nostr, user.pubkey, user.signer);
          if (!cancelled) {
            setCharacterStartTimestamp(startTimestamp);
            localStorage.setItem(CHARACTER_START_TS_STORAGE_KEY, String(startTimestamp));
          }
          return;
        }
      } catch (error) {
        console.warn('Failed to load Nostr start timestamp, using local fallback.', error);
      }

      const localRaw = localStorage.getItem(CHARACTER_START_TS_STORAGE_KEY);
      if (localRaw) {
        const parsed = Number(localRaw);
        if (!Number.isNaN(parsed)) {
          if (!cancelled) setCharacterStartTimestamp(parsed);
          return;
        }
      }

      const fallback = Date.now();
      localStorage.setItem(CHARACTER_START_TS_STORAGE_KEY, String(fallback));
      if (!cancelled) setCharacterStartTimestamp(fallback);
    };

    void loadStartTimestamp();

    return () => {
      cancelled = true;
    };
  }, [nostr, user]);

  useLayoutEffect(() => {
    if (activeTab !== 'play') return;
    const el = dialogueScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const ratio = el.clientHeight > 0 ? el.scrollHeight / el.clientHeight : 1;
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (dialogueInstantScrollRef.current) {
      el.scrollTop = maxScroll;
      dialogueInstantScrollRef.current = false;
      dialoguePinnedRef.current = true;
      prevDialogueOverflowRatioRef.current = ratio;
      return;
    }

    if (!dialoguePinnedRef.current) {
      prevDialogueOverflowRatioRef.current = ratio;
      return;
    }

    const prevR = prevDialogueOverflowRatioRef.current;
    const crossedIntoBreathe =
      prevR !== null &&
      prevR < DIALOGUE_BREATHE_OVERFLOW_RATIO &&
      ratio >= DIALOGUE_BREATHE_OVERFLOW_RATIO &&
      maxScroll > 0;

    if (crossedIntoBreathe && !prefersReduced) {
      const target = Math.max(0, Math.min(maxScroll, Math.floor(maxScroll / 2)));
      el.scrollTo({ top: target, behavior: 'smooth' });
      prevDialogueOverflowRatioRef.current = ratio;
      return;
    }

    el.scrollTop = maxScroll;
    prevDialogueOverflowRatioRef.current = ratio;
  }, [questState.dialogueLog, activeTab]);

  useLayoutEffect(() => {
    if (activeTab !== 'play') return;
    const container = eventLogScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight - container.clientHeight;
  }, [questState.worldEventLog, activeTab]);

  const completedQuestIds = useMemo(() => getCompletedQuestIds(questState), [questState]);
  const questContext = useMemo(() => getQuestContext(questState), [questState]);
  const visibleQuests = useMemo(
    () => getVisibleQuests(allQuests, questContext),
    [questContext]
  );
  const activeQuest = questState.activeQuestId ? questById[questState.activeQuestId] : null;
  const activeStep = activeQuest ? getCurrentStep(questState, activeQuest) : null;
  const nonZeroModifiers = useMemo(
    () =>
      Object.entries(questState.modifiers).filter(
        ([name, value]) => value !== 0 && getModifierMessageKind(name) !== 'hidden_class'
      ),
    [questState.modifiers]
  );
  const pendingQuestCount = useMemo(
    () => visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id)).length,
    [visibleQuests, completedQuestIds]
  );
  const visibleLocationActions = (locationActions[questState.currentLocation] ?? []).filter(
    (action) => !HIDDEN_LOCATION_ACTIONS.has(action)
  );
  const visibleSkillSheetParts = useMemo(() => {
    const parts: string[] = [];
    for (const key of SKILL_XP_KEYS) {
      const xp = questState.skills[key];
      if (xp < 1) continue;
      parts.push(`${SKILL_SHEET_LABEL[key]} ${getLevelFromXp(xp)}`);
    }
    return parts;
  }, [questState.skills]);
  const characterLevel = useMemo(() => getCharacterLevel(questState), [questState]);
  const characterClass = useMemo(() => getCharacterClass(questState.modifiers), [questState.modifiers]);
  const oldestPendingQuestId = useMemo(() => {
    const pending = visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id));
    if (pending.length === 0) return null;
    return [...pending].sort((a, b) => a.createdAt - b.createdAt)[0].id;
  }, [visibleQuests, completedQuestIds]);
  const effectiveNow = Date.now() + devDayOffsetMs;
  const dayCounter = useMemo(() => {
    if (!characterStartTimestamp) return 1;
    const elapsed = Math.max(0, effectiveNow - characterStartTimestamp);
    return Math.max(1, Math.floor(elapsed / DAY_IN_MS) + 1);
  }, [characterStartTimestamp, effectiveNow]);

  const chronicleDateTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  );

  const playDialogueLines = useMemo(
    () => questState.dialogueLog.slice(-PLAY_DIALOGUE_RECENT_MAX),
    [questState.dialogueLog]
  );

  const playDialogueBlocks = useMemo(
    () => groupDialogueLinesByVoice(playDialogueLines),
    [playDialogueLines]
  );

  const playWorldLines = useMemo(
    () => questState.worldEventLog.slice(-PLAY_WORLD_RECENT_MAX),
    [questState.worldEventLog]
  );

  const chronicleRows = useMemo((): ChronicleMergedRow[] => {
    if (!isChronicleOpen) return [];
    const dialogueRows: ChronicleMergedRow[] = questState.dialogueLog.map((line) => ({
      kind: 'dialogue' as const,
      atMs: line.atMs,
      id: line.id,
      speaker: line.speaker,
      text: line.text,
    }));
    const worldRows: ChronicleMergedRow[] = questState.worldEventLog.map((entry) => ({
      kind: 'world' as const,
      atMs: entry.atMs,
      text: entry.text,
    }));
    return [...dialogueRows, ...worldRows].sort((a, b) => {
      if (a.atMs !== b.atMs) return a.atMs - b.atMs;
      if (a.kind === b.kind) return 0;
      return a.kind === 'dialogue' ? -1 : 1;
    });
  }, [isChronicleOpen, questState.dialogueLog, questState.worldEventLog]);

  const chronicleSegments = useMemo(
    () => groupChronicleRows(chronicleRows),
    [chronicleRows]
  );

  useEffect(() => {
    if (!isQuestStateHydrated) return;
    if (completedQuestIds.length > completedQuestCountRef.current) {
      void persistQuestCheckpoint(questState);
    }
    completedQuestCountRef.current = completedQuestIds.length;
  }, [completedQuestIds, isQuestStateHydrated, questState]);

  useEffect(() => {
    if (!isQuestStateHydrated) return;
    if (dayCounter <= questState.lastDailyXpDay) return;

    const daysToGrant = dayCounter - questState.lastDailyXpDay;
    const xpToGrant = daysToGrant * DAILY_XP;
    const nextSkills = { ...questState.skills };
    for (const key of SKILLS_WITH_DAILY_XP) {
      nextSkills[key] = questState.skills[key] + xpToGrant;
    }
    const updatedState = {
      ...questState,
      experience: questState.experience + xpToGrant,
      skills: nextSkills,
      lastDailyXpDay: dayCounter,
    };
    const rewardLines = getRewardLines(questState.modifiers, updatedState.modifiers);
    const levelUpLines = getLevelUpLines(questState, updatedState);
    const dayLineBase = `Day ${dayCounter}: You gained ${xpToGrant} XP.`;
    const dayLine =
      rewardLines.length > 0 ? `${dayLineBase} ${rewardLines.join(' ')}` : dayLineBase;
    updatedState.worldEventLog = appendUniqueWorldEntries(updatedState.worldEventLog, [
      dayLine,
      ...levelUpLines,
    ]);

    setQuestState(updatedState);
    void persistQuestCheckpoint(updatedState);
  }, [dayCounter, isQuestStateHydrated, questState]);

  useEffect(() => {
    setExpandedQuestId(oldestPendingQuestId);
  }, [oldestPendingQuestId]);

  useEffect(() => {
    if (questState.dialogueLog.length > 0) return;
    const quest = questById[questState.activeQuestId ?? ''];
    if (!quest) return;
    setQuestState((prev) => {
      if (prev.dialogueLog.length > 0) return prev;
      const started = startQuest(prev, quest);
      const firstStep = getCurrentStep(started, quest);
      return {
        ...started,
        dialogueLog: [
          appendDialogue('Narrator', interpolateStepText(firstStep.text, started.playerName)),
        ],
      };
    });
  }, [questState.activeQuestId, questState.dialogueLog.length]);

  const handleResetStory = async () => {
    localStorage.removeItem(questStateStorageKey);
    setQuestState(createInitialQuestState());
    setNameInput('');
    setNameInputError(null);
    setDevDayOffsetMs(0);
    const now = Date.now();
    setCharacterStartTimestamp(now);
    localStorage.setItem(CHARACTER_START_TS_STORAGE_KEY, String(now));
    if (user?.signer) {
      try {
        await publishCharacterStartTimestamp(nostr, user.signer, now);
      } catch (error) {
        console.warn('Failed to publish reset character start timestamp; day may revert after reload.', error);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const appendDialogue = (speaker: string, text: string) => {
    const atMs = Date.now();
    return {
      id: `${speaker}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text,
      atMs,
    };
  };

  const handleStartQuest = (questId: string) => {
    const quest = questById[questId];
    if (!quest) return;
    setQuestState((prev) => {
      const started = startQuest(prev, quest);
      const firstStep = getCurrentStep(started, quest);
      return {
        ...started,
        dialogueLog: [
          ...started.dialogueLog,
          appendDialogue('Narrator', interpolateStepText(firstStep.text, started.playerName)),
        ],
      };
    });
    setNameInput('');
    setNameInputError(null);
  };

  const persistQuestCheckpoint = async (state: typeof questState) => {
    localStorage.setItem(questStateStorageKey, JSON.stringify(state));
    if (!user) return;
    try {
      await publishQuestStateSnapshot(nostr, user.signer, state);
    } catch (error) {
      console.warn('Failed to publish quest checkpoint to Nostr.', error);
    }
  };

  const handleStepChoice = (choiceId: string) => {
    if (!activeQuest) return;
    setQuestState((prev) => {
      const currentStep = getCurrentStep(prev, activeQuest);
      if (currentStep.type !== 'choice') return prev;
      const selectedChoice = currentStep.choices.find((choice) => choice.id === choiceId);
      if (!selectedChoice) return prev;

      const nextState = applyChoice(prev, activeQuest, choiceId);
      const nextStep = getCurrentStep(nextState, activeQuest);
      const nextLog = [
        ...nextState.dialogueLog,
        appendDialogue(
          PLAYER_ACTION_SPEAKER,
          formatPlayerChoiceDialogueLine(prev.playerName, selectedChoice.label)
        ),
      ];

      if (nextStep.type === 'message') {
        nextLog.push(appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)));
      } else if (!nextState.progressByQuestId[activeQuest.id]?.isCompleted) {
        nextLog.push(appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)));
      }
      const wasCompleted = Boolean(prev.progressByQuestId[activeQuest.id]?.isCompleted);
      const isCompleted = Boolean(nextState.progressByQuestId[activeQuest.id]?.isCompleted);
      if (!wasCompleted && isCompleted) {
        nextLog.push(appendDialogue(QUEST_DIVIDER_SPEAKER, ''));
      }

      const boarLine = 'You fended off a wild boar!';
      const rewardLines = getRewardLines(prev.modifiers, nextState.modifiers);
      const levelUpLines = getLevelUpLines(prev, nextState);
      const boarLines = activeQuest.id === 'quest-002-boar-ambush' ? [boarLine] : [];
      const worldEventLog = appendUniqueWorldEntries(nextState.worldEventLog, [
        ...boarLines,
        ...rewardLines,
        ...levelUpLines,
      ]);

      return {
        ...nextState,
        dialogueLog: nextLog,
        worldEventLog,
      };
    });
  };

  const handleNameSubmit = () => {
    if (!activeQuest) return;
    const { nextState, error } = submitPlayerName(questState, activeQuest, nameInput);
    if (error) {
      setNameInputError(error);
      return;
    }
    setNameInputError(null);
    const nextStep = getCurrentStep(nextState, activeQuest);
    const submittedName = nameInput.trim();

    if (activeQuest.id === 'quest-001-origin') {
      const updatedState = {
        ...nextState,
        activeQuestId: null,
        flags: Array.from(new Set([...nextState.flags, 'quest001-complete'])),
        progressByQuestId: {
          ...nextState.progressByQuestId,
          [activeQuest.id]: {
            ...nextState.progressByQuestId[activeQuest.id],
            isCompleted: true,
          },
        },
        dialogueLog: [
          ...nextState.dialogueLog,
          appendDialogue('You', submittedName),
          appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)),
          appendDialogue('Dev Message', INTRO_DEV_MESSAGE),
        ],
        worldEventLog: appendUniqueWorldEntries(nextState.worldEventLog, [
          `You remembered your name is ${submittedName}`,
          `${submittedName} is exploring the ${nextState.currentLocation}.`,
        ]),
      };
      setQuestState(updatedState);
      void persistQuestCheckpoint(updatedState);
      return;
    }

    const updatedState = {
      ...nextState,
      dialogueLog: [
        ...nextState.dialogueLog,
        appendDialogue('You', submittedName),
        appendDialogue('Narrator', interpolateStepText(nextStep.text, nextState.playerName)),
      ],
    };
    setQuestState(updatedState);
    void persistQuestCheckpoint(updatedState);
  };

  const navItems: Array<{ key: MobileTab; label: string; icon: string; isPrimary?: boolean }> = [
    { key: 'character', label: 'Character', icon: '◉' },
    { key: 'quests', label: 'Quests', icon: '☰' },
    { key: 'play', label: 'Play', icon: '✦', isPrimary: true },
    { key: 'map', label: 'Map', icon: '◈' },
    { key: 'social', label: 'Social', icon: '◎' },
  ];

  const renderTabPanel = () => {
    if (activeTab === 'character') {
      return (
        <section className="facsimile-panel space-y-4">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-semibold text-[var(--facsimile-ink)]">
              {questState.playerName || 'Stranger'}
            </h2>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">
              Level {characterLevel} Unknown {characterClass}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <img
                src={NPC_AVATAR_URL}
                alt="Character portrait"
                className="h-full w-full min-h-20 rounded-lg border border-[var(--facsimile-panel-border)] object-cover"
              />
            </div>
            <div className="col-span-3">
              <p className="text-xs text-[var(--facsimile-ink-muted)]">
                A cautious ranger from the floodplain roads, known for well-maps and steady hands.
                Travels between town and forest while carrying an unresolved oath to Ravenhall.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[var(--facsimile-ink-muted)]">
            Shareable profile link:{' '}
            <a
              href={`https://ditto.pub/${user?.pubkey ?? ''}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--facsimile-ink)] underline decoration-[var(--facsimile-panel-border)] underline-offset-2 hover:decoration-[var(--facsimile-ink)]"
            >
              your Ditto public profile
            </a>
          </p>
          <p className="text-center">
            <button
              type="button"
              onClick={() => setIsChronicleOpen(true)}
              className="text-[11px] text-[var(--facsimile-ink)] underline decoration-[var(--facsimile-panel-border)] underline-offset-2 hover:decoration-[var(--facsimile-ink)]"
            >
              Open full chronicle (dialogue and world events)
            </button>
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {characterStats.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-[var(--facsimile-panel-border)]/50 py-0.5">
                <p className="uppercase tracking-[0.12em] text-[var(--facsimile-ink-muted)]">{label}</p>
                <p className="text-[var(--facsimile-ink)]">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
            <p>
              <span className="text-[var(--facsimile-ink)]">Skills:</span>{' '}
              {visibleSkillSheetParts.length > 0 ? (
                <span className="text-[var(--facsimile-ink-muted)]">{visibleSkillSheetParts.join(', ')}</span>
              ) : (
                <span className="text-[var(--facsimile-ink-muted)]">—</span>
              )}
            </p>
            <p>
              <span className="text-[var(--facsimile-ink)]">Quest Items:</span>{' '}
              {questState.questItems.length > 0 ? (
                <span className="text-[var(--facsimile-ink-muted)]">{questState.questItems.join(', ')}</span>
              ) : (
                <span className="text-[var(--facsimile-ink-muted)]">—</span>
              )}
            </p>
            <p><span className="text-[var(--facsimile-ink)]">Characteristics:</span></p>
            <p><span className="text-[var(--facsimile-ink)]">Relationships:</span></p>
            <p><span className="text-[var(--facsimile-ink)]">Affinities:</span></p>
            <p><span className="text-[var(--facsimile-ink)]">Afflictions:</span></p>
            <p><span className="text-[var(--facsimile-ink)]">Blessings:</span></p>
            <p><span className="text-[var(--facsimile-ink)]">Curses:</span></p>
            {nonZeroModifiers.length > 0 ? (
              <p>
                <span className="text-[var(--facsimile-ink)]">Modifiers:</span>{' '}
                {nonZeroModifiers.map(([name, value]) => `${name} ${value}`).join(', ')}
              </p>
            ) : null}
          </div>
        </section>
      );
    }

    if (activeTab === 'quests') {
      return (
        <section className="facsimile-panel space-y-5">
          <p className="facsimile-kicker">Quests</p>
          <div className="space-y-3">
            {visibleQuests.map((quest) => {
              const isExpanded = expandedQuestId === quest.id;
              const isCompleted = completedQuestIds.includes(quest.id);

              return (
                <div key={quest.id} className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
                  <button
                    type="button"
                    onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                    className="w-full px-3 py-2 text-left"
                  >
                    <p className={`text-sm ${isCompleted ? 'line-through opacity-70' : ''}`}>{quest.title}</p>
                  </button>
                  {isExpanded ? (
                    <div className="border-t border-[var(--facsimile-panel-border)] px-3 py-2">
                      <p className="text-xs text-[var(--facsimile-ink-muted)]">{quest.briefing}</p>
                      <button
                        type="button"
                        onClick={() => {
                          dialogueInstantScrollRef.current = true;
                          handleStartQuest(quest.id);
                          setActiveTab('play');
                        }}
                        className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--facsimile-ink)]"
                      >
                        {isCompleted ? 'Completed' : 'Track Quest'}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (activeTab === 'map') {
      return (
        <section className="facsimile-panel space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--facsimile-ink)]">Unknown District</h2>
          <ul className="space-y-3 text-sm text-[var(--facsimile-ink-muted)]">
            <li className="border-l border-amber-500/40 pl-3">Forest</li>
            {questState.flags.includes(SILVER_LAKE_FLAG) ? (
              <li className="border-l border-amber-500/40 pl-3">Silver Lake</li>
            ) : null}
          </ul>
        </section>
      );
    }

    if (activeTab === 'social') {
      const feedEvents = socialFeedQuery.data ?? [];
      const signalsBundle = socialSignalsQuery.data ?? {
        pinned: [] as NostrEvent[],
        latest: [] as NostrEvent[],
      };
      const lobbyEvents = socialLobbyQuery.data ?? [];

      return (
        <section className="facsimile-panel space-y-4">
          <p className="facsimile-kicker">Social</p>
          {user ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] px-2 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Strangers</p>
                <p className="text-sm text-[var(--facsimile-ink)]">{socialStats.totalPlayers}</p>
              </div>
              <div className="rounded-md border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] px-2 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Kindred Spirits</p>
                <p className="text-sm text-[var(--facsimile-ink)]">{socialStats.kindredSpirits}</p>
              </div>
            </div>
          ) : null}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Activity</p>
            <div className="overflow-hidden rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
              <div className="facsimile-scroll max-h-64 overflow-y-auto px-3 py-2">
                {!user ? (
                  <p className="text-xs text-[var(--facsimile-ink-muted)]">
                    Log in to see activity from people you follow.
                  </p>
                ) : socialFeedQuery.isPending ? (
                  <p className="text-xs text-[var(--facsimile-ink-muted)]">Loading…</p>
                ) : socialFeedQuery.isError ? (
                  <p className="text-xs text-rose-300">Could not load the activity feed.</p>
                ) : feedEvents.length === 0 ? (
                  <p className="text-xs text-[var(--facsimile-ink-muted)]">
                    No recent posts with tag <span className="text-[var(--facsimile-ink)]">{NSG_SOCIAL_FEED_T}</span>{' '}
                    from people you follow.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
                    {feedEvents.map((event) => (
                      <li key={event.id} className="border-l border-[var(--facsimile-accent)]/50 pl-2">
                        <span className="text-[var(--facsimile-ink)]">{event.pubkey.slice(0, 8)}</span>{' '}
                        {truncatePlaintext(event.content, 220)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Signals</p>
            {socialSignalsQuery.isPending ? (
              <p className="text-xs text-[var(--facsimile-ink-muted)]">Loading…</p>
            ) : socialSignalsQuery.isError ? (
              <p className="text-xs text-rose-300">Could not load signals.</p>
            ) : (
              <ul className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
                {signalsBundle.pinned.map((event) => (
                  <li key={event.id} className="border-l border-amber-500/50 pl-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-amber-200/80">Pinned</span>{' '}
                    <span className="text-[var(--facsimile-ink)]">{event.pubkey.slice(0, 8)}</span>{' '}
                    {truncatePlaintext(event.content, 220)}
                  </li>
                ))}
                {signalsBundle.latest.map((event) => (
                  <li key={event.id} className="border-l border-[var(--facsimile-panel-border)] pl-2">
                    <span className="text-[var(--facsimile-ink)]">{event.pubkey.slice(0, 8)}</span>{' '}
                    {truncatePlaintext(event.content, 220)}
                  </li>
                ))}
                {signalsBundle.pinned.length === 0 && signalsBundle.latest.length === 0 ? (
                  <li className="border-l border-[var(--facsimile-panel-border)] pl-2 text-[var(--facsimile-ink-muted)]">
                    No signals yet. Post a kind 1 note with tag{' '}
                    <span className="text-[var(--facsimile-ink)]">{NSG_SOCIAL_SIGNAL_T}</span>.
                  </li>
                ) : null}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2">
            <div className="mb-2 grid grid-cols-3 gap-1.5">
              {['Guild', 'Market', 'Player Quests'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Coming soon"
                  className="social-channel-button cursor-not-allowed rounded-md border border-[var(--facsimile-panel-border)] bg-black/80 px-2 py-1 text-[11px] text-[var(--facsimile-ink-muted)] opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
            {user ? (
              <>
                <div className="facsimile-scroll mb-2 h-36 overflow-y-auto rounded-md bg-black/35 p-2">
                  {socialLobbyQuery.isPending ? (
                    <p className="text-xs text-[var(--facsimile-ink-muted)]">Loading lobby…</p>
                  ) : socialLobbyQuery.isError ? (
                    <p className="text-xs text-rose-300">Could not load the lobby.</p>
                  ) : (
                    <ul className="space-y-1 text-xs text-[var(--facsimile-ink-muted)]">
                      {lobbyEvents.map((event) => (
                        <li key={event.id}>
                          <span className="text-[var(--facsimile-ink)]">{event.pubkey.slice(0, 8)}</span>{' '}
                          {truncatePlaintext(event.content, 280)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {lobbyError ? <p className="mb-1 text-[11px] text-rose-300">{lobbyError}</p> : null}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={lobbyInput}
                    onChange={(event) => setLobbyInput(event.target.value)}
                    placeholder="Lobby message…"
                    disabled={isLobbySendPending}
                    className="w-full rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)] placeholder:text-[var(--facsimile-ink-muted)] focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={isLobbySendPending}
                    onClick={handleLobbySend}
                    className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)] disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-[var(--facsimile-ink-muted)]">Log in to chat in the public lobby.</p>
            )}
          </div>
        </section>
      );
    }

    const showOriginStartHint =
      activeQuest?.id === 'quest-001-origin' && activeStep?.id === 'start' && activeStep.type === 'choice';

    return (
      <section className="flex flex-col gap-2">
        <div
          ref={dialogueScrollRef}
          onScroll={handleDialogueScroll}
          className="facsimile-scroll h-[30rem] overflow-y-auto rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2"
        >
          <div className="space-y-3">
            {playDialogueBlocks.map((block, blockIndex) => (
              <div
                key={`${block.role}-${block.lines[0]?.id ?? `b-${blockIndex}`}`}
                className="dialogue-line-reveal py-0.5"
              >
                <DialogueVoiceBlock presentation="play" role={block.role} lines={block.lines} />
              </div>
            ))}
            {activeQuest && activeStep ? (
              <div className="dialogue-line-reveal py-0.5">
                {activeStep.type === 'choice' ? (
                  <div className="space-y-2">
                    {showOriginStartHint ? (
                      <p className="facsimile-kicker px-0.5">Choose a reply to continue</p>
                    ) : null}
                    <ul className="space-y-1.5">
                      {activeStep.choices.map((choice) => (
                        <li key={choice.id}>
                          <button
                            type="button"
                            className="dialogue-option-button facsimile-choice block w-full rounded-md px-3 py-2 text-left text-xs text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
                            onClick={() => handleStepChoice(choice.id)}
                          >
                            {choice.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {activeStep.type === 'input' ? (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(event) => setNameInput(event.target.value)}
                      placeholder={activeStep.placeholder}
                      className="w-full rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)] placeholder:text-[var(--facsimile-ink-muted)] focus:outline-none"
                    />
                    {nameInputError ? (
                      <p className="text-xs text-rose-300">{nameInputError}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleNameSubmit}
                      className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)]"
                    >
                      {activeStep.submitLabel}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {questState.dialogueLog.length > PLAY_DIALOGUE_RECENT_MAX ? (
          <p className="text-center text-[10px] text-[var(--facsimile-ink-muted)]">
            Showing the last {PLAY_DIALOGUE_RECENT_MAX} dialogue lines. Older lines are in the chronicle.
          </p>
        ) : null}
        <div className="overflow-hidden rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
          <div
            ref={eventLogScrollRef}
            className="facsimile-scroll h-20 overflow-y-auto px-2 py-2"
          >
            <ul className="space-y-1 pl-4 text-[11px] text-[var(--facsimile-ink-muted)]">
              {playWorldLines.map((entry, index) => (
                <li key={`${entry.atMs}-${index}-${entry.text}`} className="list-disc">
                  {entry.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {questState.worldEventLog.length > PLAY_WORLD_RECENT_MAX ? (
          <p className="text-center text-[10px] text-[var(--facsimile-ink-muted)]">
            Showing the last {PLAY_WORLD_RECENT_MAX} world events. Older events are in the chronicle.
          </p>
        ) : null}
        {visibleLocationActions.length > 0 ? (
          <div className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {visibleLocationActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="location-action-button w-full rounded-md border border-[var(--facsimile-panel-border)] bg-[rgba(20,23,31,0.82)] px-2 py-1.5 text-left text-xs text-[var(--facsimile-ink-muted)] hover:border-[var(--facsimile-accent)] hover:text-[var(--facsimile-ink)]"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {questState.flags.includes(SILVER_LAKE_FLAG) &&
        (questState.currentLocation === 'Forest' || questState.currentLocation === 'Silver Lake') ? (
          <div className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2">
            <div className="flex flex-col gap-1.5">
              {questState.currentLocation === 'Forest' ? (
                <button
                  type="button"
                  className="location-action-button w-full rounded-md border border-[var(--facsimile-panel-border)] bg-[rgba(20,23,31,0.82)] px-2 py-1.5 text-left text-xs text-[var(--facsimile-ink-muted)] hover:border-[var(--facsimile-accent)] hover:text-[var(--facsimile-ink)]"
                  onClick={() =>
                    setQuestState((prev) => ({
                      ...prev,
                      currentLocation: 'Silver Lake',
                    }))
                  }
                >
                  Visit the Silver Lake
                </button>
              ) : null}
              {questState.currentLocation === 'Silver Lake' ? (
                <button
                  type="button"
                  className="location-action-button w-full rounded-md border border-[var(--facsimile-panel-border)] bg-[rgba(20,23,31,0.82)] px-2 py-1.5 text-left text-xs text-[var(--facsimile-ink-muted)] hover:border-[var(--facsimile-accent)] hover:text-[var(--facsimile-ink)]"
                  onClick={() =>
                    setQuestState((prev) => ({
                      ...prev,
                      currentLocation: 'Forest',
                    }))
                  }
                >
                  Return to the Forest
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <>
    <main className="facsimile-shell mystery-ui min-h-screen p-2 sm:p-6">
      <div className="facsimile-phone-frame mx-auto">
        <div className="facsimile-glow" aria-hidden />
        <section className="facsimile-phone-content flex w-full flex-col gap-2 px-3 py-2">
          <header className="sticky top-0 z-20 rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel)] px-2 py-1.5 backdrop-blur">
            <div className="relative flex items-center justify-between">
              <p className="mystery-muted text-[10px] uppercase tracking-[0.2em]">Day {dayCounter}</p>
              <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)]">
                v0.4.3-dev
              </p>
              <p className="mystery-muted text-[10px] uppercase tracking-[0.2em]">{questState.currentLocation}</p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDevDayOffsetMs((prev) => prev + DAY_IN_MS)}
                className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink)]"
              >
                24hr
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
                >
                  Log out
                </button>
                <button
                  type="button"
                  onClick={handleResetStory}
                  className="text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
                >
                  Reset Story
                </button>
              </div>
            </div>
          </header>
          {renderTabPanel()}
        </section>
        <nav className="facsimile-bottom-nav" aria-label="Primary game navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`facsimile-nav-button relative ${item.isPrimary ? 'facsimile-nav-primary' : ''} ${isActive ? 'is-active' : ''}`}
                aria-label={item.label}
              >
                {item.key === 'quests' && pendingQuestCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--facsimile-accent)] bg-black px-1 text-[9px] leading-none text-[var(--facsimile-ink)]">
                    {pendingQuestCount}
                  </span>
                ) : null}
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px] uppercase tracking-[0.16em]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </main>
    <Dialog open={isChronicleOpen} onOpenChange={setIsChronicleOpen}>
      <DialogContent className="max-h-[85vh] max-w-lg border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel)] text-[var(--facsimile-ink)]">
        <DialogHeader>
          <DialogTitle>Chronicle</DialogTitle>
          <DialogDescription className="text-[var(--facsimile-ink-muted)]">
            Dialogue and world events, oldest first.
          </DialogDescription>
        </DialogHeader>
        {isChronicleOpen ? (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {chronicleSegments.map((segment, index) => {
              if (segment.type === 'world') {
                const row = segment.row;
                return (
                  <div
                    key={`world-${row.atMs}-${index}-${row.text.slice(0, 24)}`}
                    className="border-b border-[var(--facsimile-panel-border)]/60 pb-3 last:border-b-0"
                  >
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--facsimile-ink-muted)]">
                      {chronicleDateTimeFmt.format(row.atMs)}
                    </p>
                    <p className="text-sm text-[var(--facsimile-ink-muted)]">{row.text}</p>
                  </div>
                );
              }
              const first = segment.lines[0];
              return (
                <div
                  key={`dlg-${segment.role}-${first?.id ?? index}`}
                  className="border-b border-[var(--facsimile-panel-border)]/60 pb-3 last:border-b-0"
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--facsimile-ink-muted)]">
                    {chronicleDateTimeFmt.format(first.atMs)}
                  </p>
                  <DialogueVoiceBlock role={segment.role} lines={segment.lines} />
                </div>
              );
            })}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
