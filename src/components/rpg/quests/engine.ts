import type {
  ChoiceEffect,
  DialogueLogEntry,
  JournalLogEntry,
  ModifierMap,
  QuestChoice,
  QuestContext,
  QuestDefinition,
  QuestImageRef,
  QuestProgress,
  QuestState,
  QuestStep,
  QuestVisualBeat,
  WorldEventLogEntry,
} from './types';
import {
  appendUniqueWorldEntries,
  collectChoiceWorldLogLines,
  interpolateQuestWorldLogTemplates,
} from '../worldLog';
import { canonicalizeModifierMap, migrateModifiersToCanonical } from '../modifiers/canonical';
import {
  displayLabelForClassSlug,
  getCharacterClass,
  pickDominantLockedSlug,
  stripNonLockedClassModifiers,
} from '../classArchetype';
import {
  buildClassLockDialogueLines,
  buildRaceLockDialogueLines,
  tagDialogueSourceQuest,
} from '../dialogueFormat';
import { CLASS_ARCHETYPE_SLUGS, QUEST_FIRST_NIGHT_ID, QUEST_ORIGIN_ID, VALID_SAVE_LOCATIONS } from '../constants';
import { SKILL_EVENT_LABEL, SKILL_XP_KEYS } from './skills-config';
import { LEGACY_RACE_SLUG_REWRITES, getRaceDefinition, type RaceDefinition } from '../races';

const parseTimestampFromDialogueId = (id: string): number | null => {
  const m = id.match(/-(\d{10,16})-[a-z0-9]+$/i);
  if (!m) return null;
  return Number(m[1]);
};

const normalizeQuestImageRef = (raw: unknown): QuestImageRef | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.src !== 'string' || o.src.trim().length === 0) return null;
  const alt = typeof o.alt === 'string' && o.alt.trim().length > 0 ? o.alt : undefined;
  return alt !== undefined ? { src: o.src.trim(), alt } : { src: o.src.trim() };
};

const normalizeVisualBeat = (raw: unknown): QuestVisualBeat | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (kind === 'image') {
    if (typeof o.src !== 'string' || o.src.trim().length === 0) return undefined;
    const alt = typeof o.alt === 'string' && o.alt.trim().length > 0 ? o.alt : undefined;
    return alt !== undefined
      ? { kind: 'image', src: o.src.trim(), alt }
      : { kind: 'image', src: o.src.trim() };
  }
  if (kind === 'image-row') {
    if (!Array.isArray(o.images)) return undefined;
    const images: QuestImageRef[] = [];
    for (const item of o.images) {
      const ref = normalizeQuestImageRef(item);
      if (ref) images.push(ref);
    }
    if (images.length === 0) return undefined;
    return { kind: 'image-row', images };
  }
  return undefined;
};

/** Removed from UI; older checkpoints still carry this as `Dev Message` after origin quest name submit. */
const LEGACY_ORIGIN_COMPLETION_DEV_WELCOME = 'Welcome to No Stranger Game!';

const normalizeDialogueLog = (entries: unknown): DialogueLogEntry[] => {
  if (!Array.isArray(entries)) return [];
  const now = Date.now();
  return entries
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return { id: `unknown-${now}-${index}`, speaker: 'Narrator', text: '', atMs: now + index };
      }
      const o = entry as Record<string, unknown>;
      const id = typeof o.id === 'string' ? o.id : `line-${now}-${index}`;
      const speaker = typeof o.speaker === 'string' ? o.speaker : 'Narrator';
      const text = typeof o.text === 'string' ? o.text : '';
      let atMs: number;
      if (typeof o.atMs === 'number' && Number.isFinite(o.atMs)) {
        atMs = o.atMs;
      } else {
        const parsed = parseTimestampFromDialogueId(id);
        atMs = parsed ?? now + index;
      }
      const rawSq = o.sourceQuestId;
      const sourceQuestId =
        typeof rawSq === 'string' && rawSq.trim().length > 0 ? rawSq.trim() : undefined;
      const visualBeat = normalizeVisualBeat(o.visualBeat);
      const base =
        visualBeat !== undefined ? { id, speaker, text, atMs, visualBeat } : { id, speaker, text, atMs };
      return sourceQuestId !== undefined ? { ...base, sourceQuestId } : base;
    })
    .filter(
      (line) =>
        !(
          line.speaker === 'Dev Message' &&
          line.text.trim() === LEGACY_ORIGIN_COMPLETION_DEV_WELCOME
        )
    );
};

const normalizeWorldEventLog = (raw: unknown): WorldEventLogEntry[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const anchor = Date.now();

  if (raw.every((item) => typeof item === 'string')) {
    const strings = raw as string[];
    const unique = Array.from(new Set(strings));
    const base = anchor - unique.length * 1000;
    return unique.map((text, i) => ({ text, atMs: base + i * 1000 }));
  }

  if (
    raw.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).text === 'string'
    )
  ) {
    const rows = raw as Array<{ text: string; atMs?: number }>;
    const seen = new Set<string>();
    const out: WorldEventLogEntry[] = [];
    rows.forEach((row, idx) => {
      if (seen.has(row.text)) return;
      seen.add(row.text);
      const atMs =
        typeof row.atMs === 'number' && Number.isFinite(row.atMs)
          ? row.atMs
          : anchor - (rows.length - idx) * 1000;
      out.push({ text: row.text, atMs });
    });
    return out;
  }

  return [];
};

const normalizeJournalLog = (entries: unknown): JournalLogEntry[] => {
  if (!Array.isArray(entries)) return [];
  const now = Date.now();
  const out: JournalLogEntry[] = [];
  entries.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const o = entry as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : `journal-${now}-${index}`;
    const questId = typeof o.questId === 'string' ? o.questId.trim() : '';
    const text = typeof o.text === 'string' ? o.text : '';
    const atMs =
      typeof o.atMs === 'number' && Number.isFinite(o.atMs) ? o.atMs : now + index;
    if (!questId || text.trim().length === 0) return;
    const rawRewards = o.completionRewards;
    let completionRewards: string[] | undefined;
    if (Array.isArray(rawRewards)) {
      const lines = rawRewards.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
      if (lines.length > 0) completionRewards = lines;
    }
    out.push(
      completionRewards !== undefined ? { id, questId, text, atMs, completionRewards } : { id, questId, text, atMs }
    );
  });
  const byQuestId = new Map<string, JournalLogEntry>();
  for (const row of out.sort((a, b) => a.atMs - b.atMs)) {
    const existing = byQuestId.get(row.questId);
    if (!existing) {
      byQuestId.set(row.questId, row);
      continue;
    }
    const mergedParts = [existing.text.trim(), row.text.trim()].filter((s) => s.length > 0);
    const mergedText = Array.from(new Set(mergedParts)).join(' ').trim();
    const mergedRewards = Array.from(
      new Set([...(existing.completionRewards ?? []), ...(row.completionRewards ?? [])])
    );
    byQuestId.set(row.questId, {
      ...existing,
      id: row.id,
      atMs: Math.max(existing.atMs, row.atMs),
      text: mergedText.length > 0 ? mergedText : existing.text,
      ...(mergedRewards.length > 0 ? { completionRewards: mergedRewards } : {}),
    });
  }
  return Array.from(byQuestId.values()).sort((a, b) => a.atMs - b.atMs);
};

/** Old saves: forest branch lived on origin after the name step — now `quest-002-first-night`. */
const LEGACY_ORIGIN_FOREST_STEP_IDS = new Set([
  'flavor-five',
  'flavor-call-help',
  'flavor-pockets',
  'flavor-tree',
  'flavor-stream',
  'flavor-still',
  'compass-four',
  'boar-encounter',
  'boar-aftermath',
  'dusk-choice',
  'shelter-lean-end',
  'dark-pitch',
  'dark-branch',
  'yell-help-end',
  'creep-moonlit',
  'creep-sleep-end',
  'stay-blue-bugs',
  'bugs-fork',
  'bugs-shelter-end',
  'follow-ravine',
  'follow-outcrop-end',
]);

const migrateLegacyOriginForestProgress = (args: {
  progressByQuestId: Record<string, QuestProgress>;
  activeQuestId: string | null;
  unveiledQuestIds: string[];
}): {
  progressByQuestId: Record<string, QuestProgress>;
  activeQuestId: string | null;
  unveiledQuestIds: string[];
} => {
  const { activeQuestId, unveiledQuestIds } = args;
  const progressByQuestId = { ...args.progressByQuestId };
  const originProg = progressByQuestId[QUEST_ORIGIN_ID];
  if (!originProg || originProg.isCompleted) {
    return { progressByQuestId, activeQuestId, unveiledQuestIds };
  }
  if (!LEGACY_ORIGIN_FOREST_STEP_IDS.has(originProg.currentStepId)) {
    return { progressByQuestId, activeQuestId, unveiledQuestIds };
  }

  progressByQuestId[QUEST_FIRST_NIGHT_ID] = {
    currentStepId: originProg.currentStepId,
    isCompleted: false,
    choiceHistory: Array.isArray(originProg.choiceHistory) ? [...originProg.choiceHistory] : [],
  };
  progressByQuestId[QUEST_ORIGIN_ID] = {
    currentStepId: 'start',
    isCompleted: true,
    choiceHistory: [],
  };

  let nextActive = activeQuestId;
  if (nextActive === QUEST_ORIGIN_ID) nextActive = QUEST_FIRST_NIGHT_ID;

  return {
    progressByQuestId,
    activeQuestId: nextActive,
    unveiledQuestIds: Array.from(new Set([...unveiledQuestIds, QUEST_FIRST_NIGHT_ID])),
  };
};

export const createInitialSkills = (): QuestState['skills'] => ({
  explorationXp: 0,
  foragingXp: 0,
  meleeAttackXp: 0,
});

export const createInitialQuestState = (): QuestState => ({
  activeQuestId: 'quest-001-origin',
  progressByQuestId: {},
  modifiers: {},
  flags: [],
  currentLocation: 'Forest',
  playerName: '',
  experience: 0,
  skills: createInitialSkills(),
  lastDailyXpDay: 1,
  dialogueLog: [],
  worldEventLog: [],
  journalLog: [],
  questItems: [],
  assignedRaceSlug: null,
  lockedClassSlug: null,
  unveiledQuestIds: ['quest-001-origin'],
  health: 75,
  characterCreationDateEastern: null,
  characterCreatedAtAppVersion: null,
});

export const normalizeQuestState = (state: Partial<QuestState>): QuestState => {
  const initial = createInitialQuestState();
  const legacyExperience = typeof state.experience === 'number' ? state.experience : initial.experience;
  const explorationXp =
    typeof state.skills?.explorationXp === 'number' && Number.isFinite(state.skills.explorationXp)
      ? Math.max(0, Math.floor(state.skills.explorationXp))
      : Math.max(0, Math.floor(legacyExperience));
  const foragingXp =
    typeof state.skills?.foragingXp === 'number' && Number.isFinite(state.skills.foragingXp)
      ? Math.max(0, Math.floor(state.skills.foragingXp))
      : 0;
  const meleeAttackXp =
    typeof state.skills?.meleeAttackXp === 'number' && Number.isFinite(state.skills.meleeAttackXp)
      ? Math.max(0, Math.floor(state.skills.meleeAttackXp))
      : 0;
  const dialogueLog = normalizeDialogueLog(state.dialogueLog);
  const worldEventLog = normalizeWorldEventLog(state.worldEventLog ?? []);
  const journalLog = normalizeJournalLog((state as { journalLog?: unknown }).journalLog);
  const questItemsRaw = state.questItems;
  const questItems = Array.isArray(questItemsRaw)
    ? questItemsRaw.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];
  const rawLocation =
    typeof state.currentLocation === 'string' && state.currentLocation.trim().length > 0
      ? state.currentLocation.trim()
      : initial.currentLocation;
  const currentLocation = VALID_SAVE_LOCATIONS.has(rawLocation) ? rawLocation : initial.currentLocation;

  const rawUnveiled = (state as { unveiledQuestIds?: unknown }).unveiledQuestIds;
  let unveiledQuestIds: string[];
  if (Array.isArray(rawUnveiled)) {
    unveiledQuestIds = Array.from(
      new Set(rawUnveiled.filter((s): s is string => typeof s === 'string' && s.length > 0))
    );
  } else if (state.progressByQuestId && Object.keys(state.progressByQuestId).length > 0) {
    /**
     * Legacy save (no unveil tracking yet, but has quest progress) — mark every quest
     * the player has touched as already-unveiled so the cap doesn't retro-hide them.
     * Newly-eligible quests after this point will queue normally.
     */
    unveiledQuestIds = Object.keys(state.progressByQuestId);
  } else {
    unveiledQuestIds = initial.unveiledQuestIds;
  }

  const rawHealth = (state as { health?: unknown }).health;
  const health =
    typeof rawHealth === 'number' && Number.isFinite(rawHealth)
      ? Math.max(0, Math.min(100, Math.floor(rawHealth)))
      : initial.health;

  const rawCreation = (state as { characterCreationDateEastern?: unknown }).characterCreationDateEastern;
  const characterCreationDateEastern =
    typeof rawCreation === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawCreation) ? rawCreation : null;

  const rawCreatedVer = (state as { characterCreatedAtAppVersion?: unknown }).characterCreatedAtAppVersion;
  const characterCreatedAtAppVersion =
    typeof rawCreatedVer === 'string' && /^\d+\.\d+\.\d+/.test(rawCreatedVer.trim())
      ? rawCreatedVer.trim().split(/[-+]/, 1)[0]!
      : null;

  const rawModifiers =
    state.modifiers && typeof state.modifiers === 'object' ? (state.modifiers as ModifierMap) : initial.modifiers;

  const rawAssignedRaceSlug =
    typeof state.assignedRaceSlug === 'string' && state.assignedRaceSlug.trim().length > 0
      ? state.assignedRaceSlug.trim().toLowerCase()
      : null;
  const assignedRaceSlug =
    rawAssignedRaceSlug !== null
      ? (LEGACY_RACE_SLUG_REWRITES[rawAssignedRaceSlug] ?? rawAssignedRaceSlug)
      : null;

  const migratedModifiers = migrateModifiersToCanonical(rawModifiers);

  const rawLock = (state as { lockedClassSlug?: unknown }).lockedClassSlug;
  let lockedClassSlug: string | null =
    typeof rawLock === 'string' && rawLock.trim().length > 0 ? rawLock.trim().toLowerCase() : null;
  if (lockedClassSlug !== null && !(CLASS_ARCHETYPE_SLUGS as readonly string[]).includes(lockedClassSlug)) {
    lockedClassSlug = null;
  }

  let normalizedModifiers = migratedModifiers;
  if (lockedClassSlug === null) {
    const candidate = pickDominantLockedSlug(normalizedModifiers);
    if (candidate) {
      lockedClassSlug = candidate;
      normalizedModifiers = stripNonLockedClassModifiers(normalizedModifiers, candidate);
    }
  } else {
    normalizedModifiers = stripNonLockedClassModifiers(normalizedModifiers, lockedClassSlug);
  }

  const rawProgress = state.progressByQuestId;
  const baseProgress: Record<string, QuestProgress> =
    rawProgress && typeof rawProgress === 'object'
      ? { ...(rawProgress as Record<string, QuestProgress>) }
      : {};

  const rawActiveQuestId = state.activeQuestId;
  const resolvedActiveQuestId =
    typeof rawActiveQuestId === 'string' && rawActiveQuestId.length > 0
      ? rawActiveQuestId
      : initial.activeQuestId;

  const migrated = migrateLegacyOriginForestProgress({
    progressByQuestId: baseProgress,
    activeQuestId: resolvedActiveQuestId,
    unveiledQuestIds,
  });

  return {
    ...initial,
    ...state,
    currentLocation,
    experience: legacyExperience,
    assignedRaceSlug,
    lockedClassSlug,
    modifiers: normalizedModifiers,
    skills: {
      explorationXp,
      foragingXp,
      meleeAttackXp,
    },
    lastDailyXpDay: Math.max(
      1,
      Math.floor(
        typeof state.lastDailyXpDay === 'number'
          ? state.lastDailyXpDay === 0
            ? 1
            : state.lastDailyXpDay
          : initial.lastDailyXpDay
      )
    ),
    dialogueLog,
    worldEventLog,
    journalLog,
    questItems,
    unveiledQuestIds: migrated.unveiledQuestIds,
    progressByQuestId: migrated.progressByQuestId,
    activeQuestId: migrated.activeQuestId,
    health,
    characterCreationDateEastern,
    characterCreatedAtAppVersion,
  };
};

/** Parse the numeric prefix from a `quest-NNN-...` id; non-conforming ids return -1. */
export const questNumberFromId = (questId: string): number => {
  const match = questId.match(/^quest-(\d+)/);
  if (!match) return -1;
  return Number.parseInt(match[1], 10);
};

export const getXpRequiredForNextLevel = (level: number): number => {
  if (!Number.isFinite(level) || level <= 0) return 1;
  if (level === 1) return 1000;
  return Math.floor(level) * 1000;
};

const getTotalXpForLevel = (level: number): number => {
  if (!Number.isFinite(level) || level <= 0) return 0;
  const wholeLevel = Math.floor(level);
  return 1 + (1000 * (wholeLevel - 1) * wholeLevel) / 2;
};

export const getLevelFromXp = (xp: number): number => {
  if (!Number.isFinite(xp) || xp < 1) return 0;
  const totalXp = Math.floor(xp);
  const adjusted = totalXp - 1;
  const n = Math.floor((Math.sqrt(1 + (8 * adjusted) / 1000) - 1) / 2);
  return Math.max(1, n + 1);
};

/**
 * Organic `*Skill` / `*Spell` modifiers (and `skill:` / `spell:` prefixed keys) are shown on the
 * character sheet when |value| is at least this magnitude — rank **1** counts as **unlocked**.
 * Traits, blessings, class tracks, misc, and non-primary `stat:` rewards use `CLASS_UNLOCK_POINTS`
 * (5) as the unlock threshold on the sheet; sub-threshold rows appear only when modifier details
 * are enabled in dev tools.
 */
export const CHARACTER_SHEET_ORGANIC_SKILL_SPELL_MIN_MAGNITUDE = 1;

/** World log lines when XP-based skill level increases (exploration, foraging, …). */
export const getSkillLevelUpLines = (prevState: QuestState, nextState: QuestState): string[] => {
  const lines: string[] = [];
  for (const key of SKILL_XP_KEYS) {
    const prevLevel = getLevelFromXp(prevState.skills[key]);
    const nextLevel = getLevelFromXp(nextState.skills[key]);
    if (nextLevel > prevLevel) {
      lines.push(`Your skill in ${SKILL_EVENT_LABEL[key]} reached level ${nextLevel}!`);
    }
  }
  return lines;
};

export const getLevelProgressFromXp = (xp: number) => {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  const level = getLevelFromXp(safeXp);
  const xpAtCurrentLevel = getTotalXpForLevel(level);
  const xpIntoLevel = Math.max(0, safeXp - xpAtCurrentLevel);
  const xpForNextLevel = getXpRequiredForNextLevel(level);
  const progressRatio = xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 0;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progressRatio,
  };
};

export const getCharacterLevel = (state: QuestState): number =>
  getLevelFromXp(state.skills.explorationXp) +
  getLevelFromXp(state.skills.foragingXp) +
  getLevelFromXp(state.skills.meleeAttackXp);

export const getCompletedQuestIds = (state: QuestState): string[] =>
  Object.entries(state.progressByQuestId)
    .filter(([, progress]) => progress.isCompleted)
    .map(([questId]) => questId);

export const getQuestContext = (state: QuestState, currentDay: number): QuestContext => ({
  currentLocation: state.currentLocation,
  completedQuestIds: getCompletedQuestIds(state),
  flags: state.flags,
  explorationLevel: getLevelFromXp(state.skills.explorationXp),
  foragingLevel: getLevelFromXp(state.skills.foragingXp),
  meleeAttackLevel: getLevelFromXp(state.skills.meleeAttackXp),
  characterLevel: getCharacterLevel(state),
  assignedRaceSlug: state.assignedRaceSlug ?? null,
  currentDay: Math.max(1, Math.floor(currentDay)),
});

export const getVisibleQuests = (quests: QuestDefinition[], context: QuestContext): QuestDefinition[] =>
  quests
    .filter((quest) => quest.isAvailable(context) || context.completedQuestIds.includes(quest.id))
    .sort((a, b) => b.createdAt - a.createdAt);

/**
 * Player-visible quest list: eligible AND already unveiled (or completed).
 * New eligible quests stay hidden until completion-driven discovery unveils them.
 */
export const getPlayerVisibleQuests = (
  quests: QuestDefinition[],
  context: QuestContext,
  unveiledQuestIds: string[]
): QuestDefinition[] => {
  const unveiledSet = new Set(unveiledQuestIds);
  return getVisibleQuests(quests, context).filter(
    (quest) => unveiledSet.has(quest.id) || context.completedQuestIds.includes(quest.id)
  );
};

/** Quest list for Play/Quests tabs: unveiled + eligible, or every quest when dev unlock-all. */
export const getQuestListForUi = (
  quests: QuestDefinition[],
  context: QuestContext,
  unveiledQuestIds: string[],
  devUnlockAllQuests: boolean
): QuestDefinition[] => {
  if (devUnlockAllQuests) {
    return [...quests].sort((a, b) => b.createdAt - a.createdAt);
  }
  return getPlayerVisibleQuests(quests, context, unveiledQuestIds);
};

export const ensureQuestProgress = (state: QuestState, quest: QuestDefinition): QuestState => {
  if (state.progressByQuestId[quest.id]) return state;

  const nextProgress: QuestProgress = {
    currentStepId: quest.startStepId,
    isCompleted: false,
    choiceHistory: [],
  };

  return {
    ...state,
    progressByQuestId: {
      ...state.progressByQuestId,
      [quest.id]: nextProgress,
    },
  };
};

export const startQuest = (state: QuestState, quest: QuestDefinition): QuestState => {
  const withProgress = ensureQuestProgress(state, quest);

  return {
    ...withProgress,
    activeQuestId: quest.id,
  };
};

/** Reset quest progress so a location scene can be replayed (repeatable ambient quests). */
export const restartQuestProgress = (state: QuestState, quest: QuestDefinition): QuestState => ({
  ...state,
  progressByQuestId: {
    ...state.progressByQuestId,
    [quest.id]: {
      currentStepId: quest.startStepId,
      isCompleted: false,
      choiceHistory: [],
    },
  },
});

/** Deterministic tie-break among equal `race:*` scores using sorted slugs + salt. */
export const pickDominantRaceSlug = (modifiers: ModifierMap, tieSalt: string): string | null => {
  const entries = Object.entries(modifiers).filter(([key, value]) => key.startsWith('race:') && value > 0);
  if (entries.length === 0) return null;

  let maxScore = -Infinity;
  for (const [, value] of entries) {
    if (value > maxScore) maxScore = value;
  }

  const winners = entries
    .filter(([, value]) => value === maxScore)
    .map(([key]) => key.slice('race:'.length))
    .sort();

  let hash = 0;
  const basis = `${winners.join('|')}|${tieSalt}`;
  for (let i = 0; i < basis.length; i++) {
    hash = Math.imul(31, hash) + basis.charCodeAt(i);
  }
  const idx = Math.abs(hash) % winners.length;
  return winners[idx] ?? null;
};

export const getCurrentStep = (state: QuestState, quest: QuestDefinition): QuestStep => {
  const progress = state.progressByQuestId[quest.id];
  const stepId = progress?.currentStepId ?? quest.startStepId;
  return quest.steps[stepId];
};

const mergeModifiers = (
  current: ModifierMap,
  incoming: ModifierMap | undefined,
  raceLocked: boolean,
  lockedClassSlug: string | null
): ModifierMap => {
  if (!incoming) return current;
  let normalizedIncoming = canonicalizeModifierMap(incoming);
  if (raceLocked) {
    normalizedIncoming = Object.fromEntries(
      Object.entries(normalizedIncoming).filter(([modifier]) => !modifier.startsWith('race:'))
    );
  }
  if (lockedClassSlug !== null) {
    normalizedIncoming = Object.fromEntries(
      Object.entries(normalizedIncoming).filter(([modifier]) => {
        if (!modifier.startsWith('class:')) return true;
        const slug = modifier.slice('class:'.length);
        return slug === lockedClassSlug;
      })
    );
  }
  const next = { ...current };
  Object.entries(normalizedIncoming).forEach(([modifier, delta]) => {
    next[modifier] = (next[modifier] ?? 0) + delta;
  });
  return next;
};

/** Apply modifier deltas outside a quest choice (e.g. merchant buy/sell). Respects race/class merge rules. */
export const applyDirectModifiersDelta = (state: QuestState, modifiersDelta: ModifierMap): QuestState => {
  const raceLocked = state.assignedRaceSlug !== null;
  const modifiers = mergeModifiers(state.modifiers, modifiersDelta, raceLocked, state.lockedClassSlug);
  return { ...state, modifiers };
};

const mergeFlags = (current: string[], effect: ChoiceEffect | undefined): string[] => {
  const flags = effect?.flagsSet ?? [];
  if (flags.length === 0) return current;
  return Array.from(new Set([...current, ...flags]));
};

const mergeQuestItems = (current: string[], effect: ChoiceEffect | undefined): string[] => {
  const added = effect?.questItemsAdd?.filter((s) => typeof s === 'string' && s.trim().length > 0) ?? [];
  if (added.length === 0) return current;
  const seen = new Set(current);
  const next = [...current];
  for (const label of added) {
    if (seen.has(label)) continue;
    seen.add(label);
    next.push(label);
  }
  return next;
};

const appendJournalSummaryLine = (
  state: QuestState,
  questId: string,
  rawLine: string | undefined,
  playerName: string
): QuestState => {
  if (!rawLine || rawLine.trim().length === 0) return state;
  const text = interpolateStepText(rawLine.trim(), playerName);
  const existingIndex = state.journalLog.findIndex((entry) => entry.questId === questId);
  if (existingIndex >= 0) {
    const existing = state.journalLog[existingIndex];
    if (existing.text.includes(text)) return state;
    const mergedText = `${existing.text.trim()} ${text}`.trim();
    const nextJournalLog = [...state.journalLog];
    nextJournalLog[existingIndex] = {
      ...existing,
      text: mergedText,
      atMs: Date.now(),
    };
    return { ...state, journalLog: nextJournalLog };
  }
  const atMs = Date.now();
  const entry: JournalLogEntry = {
    id: `journal-${questId}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    questId,
    text,
    atMs,
  };
  return { ...state, journalLog: [...state.journalLog, entry] };
};

const moveToStep = (
  state: QuestState,
  quest: QuestDefinition,
  choice: QuestChoice,
  currentStepId: string
): QuestState => {
  const currentProgress = state.progressByQuestId[quest.id];
  const clearActive = Boolean(choice.effects?.clearActiveQuest);
  const nextStepId = clearActive ? quest.startStepId : (choice.nextStepId ?? currentStepId);
  const nextStep = quest.steps[nextStepId];
  const mergedFlags = mergeFlags(state.flags, choice.effects);
  const requiredAll = quest.completionRequiresAllFlags;
  const allCompletionFlagsMet =
    Array.isArray(requiredAll) &&
    requiredAll.length > 0 &&
    requiredAll.every((flag) => mergedFlags.includes(flag));
  const isCompleted =
    !clearActive &&
    (Boolean(choice.completeQuest || nextStep?.completeQuest) || allCompletionFlagsMet);
  const raceLocked = state.assignedRaceSlug !== null;
  const prevLockedSlug = state.lockedClassSlug;

  let modifiers = mergeModifiers(
    state.modifiers,
    choice.effects?.modifiersDelta,
    raceLocked,
    prevLockedSlug
  );

  let lockedClassSlug = prevLockedSlug;
  const classLockDialogue: DialogueLogEntry[] = [];
  const worldExtra: string[] = [];

  if (lockedClassSlug === null) {
    const candidate = pickDominantLockedSlug(modifiers);
    if (candidate) {
      lockedClassSlug = candidate;
      modifiers = stripNonLockedClassModifiers(modifiers, candidate);
      const displayClass = displayLabelForClassSlug(candidate);
      classLockDialogue.push(...tagDialogueSourceQuest(buildClassLockDialogueLines(displayClass), quest.id));
      const nm = state.playerName.trim() || 'Stranger';
      worldExtra.push(`${nm} is a ${displayClass}!`);
    }
  }

  let nextState: QuestState = {
    ...state,
    activeQuestId: isCompleted || clearActive ? null : state.activeQuestId,
    modifiers,
    lockedClassSlug,
    flags: mergedFlags,
    questItems: mergeQuestItems(state.questItems, choice.effects),
    dialogueLog: [...state.dialogueLog, ...classLockDialogue],
    worldEventLog:
      worldExtra.length > 0 ? appendUniqueWorldEntries(state.worldEventLog, worldExtra) : state.worldEventLog,
    progressByQuestId: {
      ...state.progressByQuestId,
      [quest.id]: {
        currentStepId: nextStepId,
        isCompleted,
        choiceHistory: clearActive
          ? []
          : [...(currentProgress?.choiceHistory ?? []), choice.id],
      },
    },
  };

  if (
    choice.effects?.assignRaceFromRaceModifiers &&
    state.assignedRaceSlug === null &&
    nextState.assignedRaceSlug === null
  ) {
    const slug = pickDominantRaceSlug(nextState.modifiers, state.playerName.trim() || 'stranger');
    if (slug) {
      const race = getRaceDefinition(slug);
      if (race) {
        nextState = applyRaceLockEffects(nextState, race, quest.id);
      } else {
        nextState = { ...nextState, assignedRaceSlug: slug };
      }
    }
  }

  const travelTo = choice.effects?.setCurrentLocation?.trim();
  if (travelTo && VALID_SAVE_LOCATIONS.has(travelTo)) {
    nextState = { ...nextState, currentLocation: travelTo };
  }

  return nextState;
};

/**
 * One-shot bonuses, weakness, and auto-flavor applied when a race is locked.
 * Stat deltas use canonical keys directly (`stat:strength`, ...) so they merge
 * with prior `*Stat` gains. Auto traits/characteristics use organic / misc
 * authoring keys and run through `canonicalizeModifierMap` for normalization.
 * Appends a single neutral world-log line.
 */
const applyRaceLockEffects = (
  state: QuestState,
  race: RaceDefinition,
  sourceQuestId: string
): QuestState => {
  const statDeltas: ModifierMap = {
    [`stat:${race.bonusPlus2}`]: 2,
    [`stat:${race.bonusPlus1}`]: 1,
    [`stat:${race.weaknessMinus2}`]: -2,
  };

  const flavorDeltas: ModifierMap = {};
  for (const traitKey of race.autoTraits) flavorDeltas[traitKey] = (flavorDeltas[traitKey] ?? 0) + 1;
  for (const charKey of race.autoCharacteristics) {
    flavorDeltas[charKey] = (flavorDeltas[charKey] ?? 0) + 1;
  }
  const canonicalFlavor = canonicalizeModifierMap(flavorDeltas);

  const mergedModifiers: ModifierMap = { ...state.modifiers };
  for (const [key, delta] of Object.entries(statDeltas)) {
    mergedModifiers[key] = (mergedModifiers[key] ?? 0) + delta;
  }
  for (const [key, delta] of Object.entries(canonicalFlavor)) {
    mergedModifiers[key] = (mergedModifiers[key] ?? 0) + delta;
  }

  const withRaceModifiers: QuestState = {
    ...state,
    assignedRaceSlug: race.slug,
    modifiers: mergedModifiers,
  };
  const level = getCharacterLevel(withRaceModifiers);
  const classDisplay = getCharacterClass(mergedModifiers);
  const name = state.playerName.trim() || 'Stranger';
  const returnLine = `${name} has returned from the lake… a Level ${level} ${race.displayName} ${classDisplay}.`;
  const worldEventLog = appendUniqueWorldEntries(state.worldEventLog, [returnLine]);
  const raceDialogue = tagDialogueSourceQuest(
    buildRaceLockDialogueLines(name, race.displayName, level, classDisplay),
    sourceQuestId
  );

  return {
    ...state,
    assignedRaceSlug: race.slug,
    modifiers: mergedModifiers,
    worldEventLog,
    dialogueLog: [...state.dialogueLog, ...raceDialogue],
  };
};

/**
 * Advance past a mid-quest `message` step that has `nextStepId` (Continue-style narration bridges).
 * Marks completion when landing on a terminal `message` step with `completeQuest`.
 */
export const advanceQuestMessage = (state: QuestState, quest: QuestDefinition): QuestState | null => {
  const withProgress = ensureQuestProgress(state, quest);
  const progress = withProgress.progressByQuestId[quest.id];
  if (!progress || progress.isCompleted) return null;
  const step = quest.steps[progress.currentStepId];
  if (!step || step.type !== 'message') return null;
  if (step.completeQuest) return null;
  const nextId = step.nextStepId;
  if (!nextId || !quest.steps[nextId]) return null;
  const nextStep = quest.steps[nextId];
  const completesHere = nextStep.type === 'message' && Boolean(nextStep.completeQuest);
  return {
    ...withProgress,
    activeQuestId: completesHere ? null : withProgress.activeQuestId,
    progressByQuestId: {
      ...withProgress.progressByQuestId,
      [quest.id]: {
        ...progress,
        currentStepId: nextId,
        isCompleted: completesHere,
        choiceHistory: progress.choiceHistory,
      },
    },
  };
};

export const applyChoice = (state: QuestState, quest: QuestDefinition, choiceId: string): QuestState => {
  const withProgress = ensureQuestProgress(state, quest);
  const currentStep = getCurrentStep(withProgress, quest);

  if (currentStep.type !== 'choice') return withProgress;

  const selectedChoice = currentStep.choices.find((choice) => choice.id === choiceId);
  if (!selectedChoice) return withProgress;

  let nextState = moveToStep(withProgress, quest, selectedChoice, currentStep.id);
  const worldLines = collectChoiceWorldLogLines(currentStep, selectedChoice, state.playerName);
  if (worldLines.length > 0) {
    nextState = {
      ...nextState,
      worldEventLog: appendUniqueWorldEntries(nextState.worldEventLog, worldLines),
    };
  }
  nextState = appendJournalSummaryLine(
    nextState,
    quest.id,
    selectedChoice.journalSummaryLineAdd,
    nextState.playerName
  );
  return nextState;
};

export const submitPlayerName = (
  state: QuestState,
  quest: QuestDefinition,
  playerName: string
): { nextState: QuestState; error?: string } => {
  const withProgress = ensureQuestProgress(state, quest);
  const currentStep = getCurrentStep(withProgress, quest);

  if (currentStep.type !== 'input' || currentStep.field !== 'playerName') {
    return { nextState: withProgress };
  }

  const trimmed = playerName.trim();
  const minLength = currentStep.minLength ?? 2;
  const maxLength = currentStep.maxLength ?? 32;

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return { nextState: withProgress, error: `Name must be ${minLength}-${maxLength} characters.` };
  }

  let nextState: QuestState = {
    ...withProgress,
    playerName: trimmed,
    progressByQuestId: {
      ...withProgress.progressByQuestId,
      [quest.id]: {
        ...withProgress.progressByQuestId[quest.id],
        currentStepId: currentStep.nextStepId ?? currentStep.id,
      },
    },
  };

  if (currentStep.worldEventLogAfterSubmit?.length) {
    const lines = interpolateQuestWorldLogTemplates(currentStep.worldEventLogAfterSubmit, trimmed);
    nextState = {
      ...nextState,
      worldEventLog: appendUniqueWorldEntries(nextState.worldEventLog, lines),
    };
  }
  nextState = appendJournalSummaryLine(
    nextState,
    quest.id,
    currentStep.journalSummaryLineAfterSubmit,
    trimmed
  );

  return { nextState };
};

export const interpolateStepText = (text: string, playerName: string): string =>
  text.replaceAll('{playerName}', playerName.trim() || 'Stranger');
