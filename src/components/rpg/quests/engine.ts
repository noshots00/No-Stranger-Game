import type {
  ChoiceEffect,
  DialogueLogEntry,
  JournalLogEntry,
  ModifierMap,
  QuestChoice,
  QuestContext,
  QuestDefinition,
  QuestImageRef,
  MessageQuestStep,
  PlayDayRollStaging,
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
import { isForestAutoTrackBlockedByDayRoll } from '../dayPacing';
import { applyTravelLocationChange, normalizeForestLocationFields } from '../locationPresence';
import { ensureAncientCemeteryDiscoveryFlags } from '../travelLocations';
import { isQuestEligibleForUnveil } from './branching-quest-template';
import { pushDevStepHistory } from './questStepBack';
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
import {
  CLASS_ARCHETYPE_SLUGS,
  QUEST_DAY_TWO_DREAM_ID,
  QUEST_DYERS_CRYPT_ID,
  QUEST_FIRST_NIGHT_ID,
  QUEST_ORIGIN_ID,
  QUEST_004_B_THE_DOOR_ID,
  QUEST_FOREST_CAVE_ID,
  DAY_PACING_ACTIVE_FLAG,
  FOREST_CAVE_DISCOVERED_FLAG,
  AIRSHIP_FLAG,
  JOB_SLUG_EXPLORER,
  QUEST_VILLAGE_ARRIVAL_ID,
  QUEST_MAYOR_ID,
  QUEST_PICK_A_JOB_ID,
  VILLAGE_CHOOSEABLE_JOB_SLUGS,
  VALID_SAVE_LOCATIONS,
  VILLAGE_PHASE_FLAG,
} from '../constants';
import { resolveCharacterCreatedAtAppVersion } from '../characterSaveVersion';
import { questById } from './registry';
import { resolveForestCavePrimaryKnockoutStepId } from './quest-005-forest-cave';
import { unlockJobSlug } from '../jobs/unlockJob';
import { SKILL_EVENT_LABEL, SKILL_XP_KEYS } from './skills-config';
import { LEGACY_RACE_SLUG_REWRITES, getRaceDefinition, type RaceDefinition } from '../races';
import { createEmptyArenaRecord, reconcileArenaRecordForEpoch } from '../arena/arenaRecord';
import type {
  ArenaFightRecord,
  ArenaRecord,
  GuildMembership,
  MarketEscrowEntry,
  TavernEscrowEntry,
} from './types';

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
  'flavor-five-hub',
  'flavor-call-help',
  'flavor-pockets',
  'flavor-pockets-pick',
  'flavor-tree-start',
  'flavor-tree-vista',
  'flavor-tree-fork',
  'flavor-stream',
  'flavor-still',
  'flavor-orient',
  'flavor-explore-north',
  'flavor-explore-south',
  'flavor-explore-east',
  'flavor-explore-west',
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

/** Wandering Skeleton was merged into Dyer's Crypt (quest-003). */
const LEGACY_WANDERING_SKELETON_QUEST_ID = 'quest-006-wandering-skeleton';

/** Removed single-choice Continue bridges — map in-progress saves to the next beat. */
const LEGACY_CONTINUE_BRIDGE_STEP_REDIRECTS: Record<string, string> = {
  'flavor-tree-continue': 'flavor-tree-vista',
  'dir-north-continue': 'boar-encounter',
  'tree-continue': 'tree-vista',
};

/** Mid-quest narration that only existed to force a Continue tap before the next beat. */
export const isContinueBridgeMessageStep = (step: QuestStep): step is MessageQuestStep =>
  step.type === 'message' && Boolean(step.nextStepId?.trim()) && !step.completeQuest;

const migrateLegacyContinueBridgeSteps = <T extends {
  progressByQuestId: Record<string, QuestProgress>;
  activeQuestId: string | null;
  unveiledQuestIds: string[];
}>(
  args: T
): T => {
  const progressByQuestId = { ...args.progressByQuestId };
  for (const [questId, prog] of Object.entries(progressByQuestId)) {
    const redirect = LEGACY_CONTINUE_BRIDGE_STEP_REDIRECTS[prog.currentStepId];
    if (redirect) progressByQuestId[questId] = { ...prog, currentStepId: redirect };
  }
  for (const [questId, prog] of Object.entries(progressByQuestId)) {
    if (prog.isCompleted) continue;
    const quest = questById[questId];
    if (!quest) continue;
    let stepId = prog.currentStepId;
    let guard = 0;
    while (guard++ < 32) {
      const step = quest.steps[stepId];
      if (!step || !isContinueBridgeMessageStep(step)) break;
      const nextId = step.nextStepId?.trim();
      if (!nextId || !quest.steps[nextId]) break;
      stepId = nextId;
    }
    if (stepId !== prog.currentStepId) {
      progressByQuestId[questId] = { ...prog, currentStepId: stepId };
    }
  }
  return { ...args, progressByQuestId };
};

const LEGACY_AIRSHIP_QUEST_ID = 'quest-005-airship';

const migrateAirshipQuestToForestCave = (args: {
  progressByQuestId: Record<string, QuestProgress>;
  activeQuestId: string | null;
  unveiledQuestIds: string[];
  flags: string[];
}): {
  progressByQuestId: Record<string, QuestProgress>;
  activeQuestId: string | null;
  unveiledQuestIds: string[];
  flags: string[];
} => {
  const { activeQuestId, flags } = args;
  const progressByQuestId = { ...args.progressByQuestId };
  let unveiledQuestIds = [...args.unveiledQuestIds];
  let nextFlags = [...flags];

  const airshipProg = progressByQuestId[LEGACY_AIRSHIP_QUEST_ID];
  if (airshipProg) {
    delete progressByQuestId[LEGACY_AIRSHIP_QUEST_ID];
    const caveProg = progressByQuestId[QUEST_FOREST_CAVE_ID];
    if (airshipProg.isCompleted || !caveProg) {
      progressByQuestId[QUEST_FOREST_CAVE_ID] = {
        currentStepId: airshipProg.isCompleted ? 'cave-close' : airshipProg.currentStepId,
        isCompleted: airshipProg.isCompleted,
        choiceHistory: Array.isArray(airshipProg.choiceHistory) ? [...airshipProg.choiceHistory] : [],
        devStepHistory: Array.isArray(airshipProg.devStepHistory) ? [...airshipProg.devStepHistory] : [],
      };
    }
  }

  if (unveiledQuestIds.includes(LEGACY_AIRSHIP_QUEST_ID)) {
    unveiledQuestIds = unveiledQuestIds.filter((id) => id !== LEGACY_AIRSHIP_QUEST_ID);
    if (!unveiledQuestIds.includes(QUEST_FOREST_CAVE_ID)) {
      unveiledQuestIds.push(QUEST_FOREST_CAVE_ID);
    }
  }

  let nextActive = activeQuestId;
  if (nextActive === LEGACY_AIRSHIP_QUEST_ID) {
    nextActive = QUEST_FOREST_CAVE_ID;
  }

  if (nextFlags.includes(AIRSHIP_FLAG) && !nextFlags.includes(FOREST_CAVE_DISCOVERED_FLAG)) {
    nextFlags = [...nextFlags, FOREST_CAVE_DISCOVERED_FLAG];
  }

  const caveProg = progressByQuestId[QUEST_FOREST_CAVE_ID];
  if (caveProg) {
    if (caveProg.isCompleted && caveProg.currentStepId === 'cave-enter') {
      progressByQuestId[QUEST_FOREST_CAVE_ID] = { ...caveProg, currentStepId: 'cave-close' };
    } else if (!caveProg.isCompleted && caveProg.currentStepId === 'cave-enter') {
      progressByQuestId[QUEST_FOREST_CAVE_ID] = {
        ...caveProg,
        currentStepId: resolveForestCavePrimaryKnockoutStepId(nextFlags),
      };
    }
  }

  return {
    progressByQuestId,
    activeQuestId: nextActive,
    unveiledQuestIds,
    flags: nextFlags,
  };
};

const migrateMergedWanderingSkeletonIntoDyersCrypt = (args: {
  progressByQuestId: Record<string, QuestProgress>;
  activeQuestId: string | null;
  unveiledQuestIds: string[];
}): {
  progressByQuestId: Record<string, QuestProgress>;
  activeQuestId: string | null;
  unveiledQuestIds: string[];
} => {
  const { activeQuestId } = args;
  const progressByQuestId = { ...args.progressByQuestId };
  let unveiledQuestIds = [...args.unveiledQuestIds];

  const skeletonProg = progressByQuestId[LEGACY_WANDERING_SKELETON_QUEST_ID];
  if (skeletonProg) {
    delete progressByQuestId[LEGACY_WANDERING_SKELETON_QUEST_ID];
    const cryptProg = progressByQuestId[QUEST_DYERS_CRYPT_ID];
    if (skeletonProg.isCompleted) {
      progressByQuestId[QUEST_DYERS_CRYPT_ID] = {
        currentStepId: skeletonProg.currentStepId,
        isCompleted: true,
        choiceHistory: Array.isArray(skeletonProg.choiceHistory) ? [...skeletonProg.choiceHistory] : [],
        devStepHistory: Array.isArray(skeletonProg.devStepHistory) ? [...skeletonProg.devStepHistory] : [],
      };
    } else if (!cryptProg?.isCompleted) {
      progressByQuestId[QUEST_DYERS_CRYPT_ID] = {
        currentStepId: skeletonProg.currentStepId,
        isCompleted: false,
        choiceHistory: Array.isArray(skeletonProg.choiceHistory) ? [...skeletonProg.choiceHistory] : [],
        devStepHistory: Array.isArray(skeletonProg.devStepHistory) ? [...skeletonProg.devStepHistory] : [],
      };
    }
  }

  if (unveiledQuestIds.includes(LEGACY_WANDERING_SKELETON_QUEST_ID)) {
    unveiledQuestIds = unveiledQuestIds.filter((id) => id !== LEGACY_WANDERING_SKELETON_QUEST_ID);
    if (!unveiledQuestIds.includes(QUEST_DYERS_CRYPT_ID)) {
      unveiledQuestIds.push(QUEST_DYERS_CRYPT_ID);
    }
  }

  let nextActive = activeQuestId;
  if (nextActive === LEGACY_WANDERING_SKELETON_QUEST_ID) {
    nextActive = QUEST_DYERS_CRYPT_ID;
  }

  return { progressByQuestId, activeQuestId: nextActive, unveiledQuestIds };
};

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
  dayReportModifierBaseline: {},
  dayReportQuestItemsBaseline: [],
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
  health: 100,
  characterCreationDateEastern: null,
  characterCreatedAtAppVersion: null,
  arenaRecord: { wins: 0, losses: 0, fights: [] },
  guildMembership: null,
  lastWolfHideGrantDay: 0,
  tavernEscrowByQuestId: {},
  marketEscrowByListingId: {},
  unlockedJobSlugs: [],
  activeJobSlug: null,
  jobDailyActionBySlug: {},
  resources: {},
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
  const rawLocationValidated = VALID_SAVE_LOCATIONS.has(rawLocation) ? rawLocation : initial.currentLocation;
  const rawForestSub = (state as { forestSubLocation?: unknown }).forestSubLocation;
  const forestFields = normalizeForestLocationFields(
    rawLocationValidated,
    typeof rawForestSub === 'string' ? rawForestSub : null
  );
  const currentLocation = forestFields.currentLocation;
  const forestSubLocation = forestFields.forestSubLocation;

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
  const parsedCreatedVer =
    typeof rawCreatedVer === 'string' && /^\d+\.\d+\.\d+/.test(rawCreatedVer.trim())
      ? rawCreatedVer.trim().split(/[-+]/, 1)[0]!
      : null;
  const resolvedPlayerName =
    typeof state.playerName === 'string' && state.playerName.trim().length > 0
      ? state.playerName.trim()
      : initial.playerName;
  const characterCreatedAtAppVersion = resolveCharacterCreatedAtAppVersion({
    playerName: resolvedPlayerName,
    characterCreationDateEastern,
    characterCreatedAtAppVersion: parsedCreatedVer,
  });

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

  const rawFlags = Array.isArray(state.flags)
    ? state.flags.filter((f): f is string => typeof f === 'string')
    : initial.flags;

  const coreMigrated = migrateLegacyContinueBridgeSteps(
    migrateMergedWanderingSkeletonIntoDyersCrypt(
      migrateLegacyOriginForestProgress({
        progressByQuestId: baseProgress,
        activeQuestId: resolvedActiveQuestId,
        unveiledQuestIds,
      })
    )
  );

  const migrated = migrateAirshipQuestToForestCave({
    ...coreMigrated,
    flags: rawFlags,
  });

  const progressByQuestId: Record<string, QuestProgress> = {};
  for (const [qid, prog] of Object.entries(migrated.progressByQuestId)) {
    const rawHist = (prog as QuestProgress).devStepHistory;
    const devStepHistory = Array.isArray(rawHist)
      ? rawHist.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [];
    progressByQuestId[qid] = { ...prog, devStepHistory };
  }

  const rawArena = (state as { arenaRecord?: unknown }).arenaRecord;
  let arenaRecord: ArenaRecord = createEmptyArenaRecord();
  if (rawArena && typeof rawArena === 'object') {
    const ar = rawArena as Record<string, unknown>;
    const wins = typeof ar.wins === 'number' && Number.isFinite(ar.wins) ? Math.max(0, Math.floor(ar.wins)) : 0;
    const losses =
      typeof ar.losses === 'number' && Number.isFinite(ar.losses) ? Math.max(0, Math.floor(ar.losses)) : 0;
    const fightsRaw = ar.fights;
    const fights: ArenaFightRecord[] = Array.isArray(fightsRaw)
      ? fightsRaw
          .filter((f): f is Record<string, unknown> => f && typeof f === 'object')
          .map((f) => ({
            matchEventId: typeof f.matchEventId === 'string' ? f.matchEventId : '',
            opponentName: typeof f.opponentName === 'string' ? f.opponentName : 'Unknown',
            opponentPubkey: typeof f.opponentPubkey === 'string' ? f.opponentPubkey : '',
            won: Boolean(f.won),
            myCombatRating:
              typeof f.myCombatRating === 'number' && Number.isFinite(f.myCombatRating)
                ? Math.floor(f.myCombatRating)
                : 1,
            opponentCombatRating:
              typeof f.opponentCombatRating === 'number' && Number.isFinite(f.opponentCombatRating)
                ? Math.floor(f.opponentCombatRating)
                : 1,
            atMs: typeof f.atMs === 'number' && Number.isFinite(f.atMs) ? Math.floor(f.atMs) : 0,
          }))
          .filter((f) => f.matchEventId.length > 0)
          .sort((a, b) => b.atMs - a.atMs)
          .slice(0, 50)
      : [];
    arenaRecord = reconcileArenaRecordForEpoch({ wins, losses, fights });
  }

  const rawGuild = (state as { guildMembership?: unknown }).guildMembership;
  let guildMembership: GuildMembership | null = null;
  if (rawGuild && typeof rawGuild === 'object') {
    const g = rawGuild as Record<string, unknown>;
    const guildSlug = typeof g.guildSlug === 'string' ? g.guildSlug.trim() : '';
    const guildName = typeof g.guildName === 'string' ? g.guildName.trim() : '';
    const joinedAtMs =
      typeof g.joinedAtMs === 'number' && Number.isFinite(g.joinedAtMs) ? Math.floor(g.joinedAtMs) : 0;
    const leftAtMs =
      typeof g.leftAtMs === 'number' && Number.isFinite(g.leftAtMs) ? Math.floor(g.leftAtMs) : undefined;
    if (guildSlug.length > 0 && guildName.length > 0 && joinedAtMs > 0) {
      guildMembership = { guildSlug, guildName, joinedAtMs, leftAtMs };
    }
  }

  const rawLastWolf = (state as { lastWolfHideGrantDay?: unknown }).lastWolfHideGrantDay;
  const lastWolfHideGrantDay =
    typeof rawLastWolf === 'number' && Number.isFinite(rawLastWolf)
      ? Math.max(0, Math.floor(rawLastWolf))
      : initial.lastWolfHideGrantDay ?? 0;

  const rawEscrow = (state as { tavernEscrowByQuestId?: unknown }).tavernEscrowByQuestId;
  const tavernEscrowByQuestId: Record<string, TavernEscrowEntry> = {};
  if (rawEscrow && typeof rawEscrow === 'object') {
    for (const [key, val] of Object.entries(rawEscrow as Record<string, unknown>)) {
      if (!val || typeof val !== 'object') continue;
      const row = val as Record<string, unknown>;
      const questId = typeof row.questId === 'string' ? row.questId : key;
      const rewardsRaw = row.rewards;
      if (!Array.isArray(rewardsRaw)) continue;
      const rewards: TavernEscrowEntry['rewards'] = [];
      for (const r of rewardsRaw) {
        if (!r || typeof r !== 'object') continue;
        const kind = (r as { kind?: string }).kind;
        if (kind === 'gold' && typeof (r as { amount?: number }).amount === 'number') {
          rewards.push({ kind: 'gold', amount: Math.max(0, Math.floor((r as { amount: number }).amount)) });
        }
        if (
          kind === 'modifierItem' &&
          typeof (r as { key?: string }).key === 'string' &&
          typeof (r as { quantity?: number }).quantity === 'number'
        ) {
          rewards.push({
            kind: 'modifierItem',
            key: (r as { key: string }).key,
            quantity: Math.max(1, Math.floor((r as { quantity: number }).quantity)),
          });
        }
        if (kind === 'questItem' && typeof (r as { label?: string }).label === 'string') {
          rewards.push({ kind: 'questItem', label: (r as { label: string }).label });
        }
      }
      if (rewards.length > 0) tavernEscrowByQuestId[questId] = { questId, rewards };
    }
  }

  const rawMarketEscrow = (state as { marketEscrowByListingId?: unknown }).marketEscrowByListingId;
  const marketEscrowByListingId: Record<string, MarketEscrowEntry> = {};
  if (rawMarketEscrow && typeof rawMarketEscrow === 'object') {
    for (const [key, val] of Object.entries(rawMarketEscrow as Record<string, unknown>)) {
      if (!val || typeof val !== 'object') continue;
      const row = val as Record<string, unknown>;
      const listingId = typeof row.listingId === 'string' ? row.listingId : key;
      const priceCopper =
        typeof row.priceCopper === 'number' && Number.isFinite(row.priceCopper)
          ? Math.max(0, Math.floor(row.priceCopper))
          : 0;
      const goodsRaw = row.goods;
      if (!goodsRaw || typeof goodsRaw !== 'object') continue;
      const kind = (goodsRaw as { kind?: string }).kind;
      if (
        kind === 'modifierItem' &&
        typeof (goodsRaw as { key?: string }).key === 'string' &&
        typeof (goodsRaw as { quantity?: number }).quantity === 'number'
      ) {
        marketEscrowByListingId[listingId] = {
          listingId,
          priceCopper,
          goods: {
            kind: 'modifierItem',
            key: (goodsRaw as { key: string }).key,
            quantity: Math.max(1, Math.floor((goodsRaw as { quantity: number }).quantity)),
          },
        };
      }
      if (kind === 'questItem' && typeof (goodsRaw as { label?: string }).label === 'string') {
        marketEscrowByListingId[listingId] = {
          listingId,
          priceCopper,
          goods: { kind: 'questItem', label: (goodsRaw as { label: string }).label },
        };
      }
    }
  }

  const rawUnlockedJobs = (state as { unlockedJobSlugs?: unknown }).unlockedJobSlugs;
  const unlockedJobSlugs = Array.isArray(rawUnlockedJobs)
    ? Array.from(
        new Set(
          rawUnlockedJobs.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim())
        )
      )
    : initial.unlockedJobSlugs ?? [];

  const rawActiveJob = (state as { activeJobSlug?: unknown }).activeJobSlug;
  const activeJobSlug =
    typeof rawActiveJob === 'string' && rawActiveJob.trim().length > 0 ? rawActiveJob.trim() : null;

  const rawJobDaily = (state as { jobDailyActionBySlug?: unknown }).jobDailyActionBySlug;
  const jobDailyActionBySlug: Record<string, { lastActionDay: number }> = {};
  if (rawJobDaily && typeof rawJobDaily === 'object') {
    for (const [slug, val] of Object.entries(rawJobDaily as Record<string, unknown>)) {
      if (!val || typeof val !== 'object') continue;
      const day = (val as { lastActionDay?: number }).lastActionDay;
      if (typeof day === 'number' && Number.isFinite(day)) {
        jobDailyActionBySlug[slug] = { lastActionDay: Math.max(0, Math.floor(day)) };
      }
    }
  }

  const rawResources = (state as { resources?: unknown }).resources;
  const resources: Record<string, number> = {};
  if (rawResources && typeof rawResources === 'object') {
    for (const [key, val] of Object.entries(rawResources as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        resources[key] = Math.max(0, Math.floor(val));
      }
    }
  }

  let flags = migrated.flags;
  flags = ensureAncientCemeteryDiscoveryFlags({
    flags,
    progressByQuestId,
    currentLocation,
    forestSubLocation,
  });

  const rawAckTravel = (state as { acknowledgedTravelLocationIds?: unknown }).acknowledgedTravelLocationIds;
  const acknowledgedTravelLocationIds = Array.isArray(rawAckTravel)
    ? Array.from(
        new Set(
          rawAckTravel.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).map((id) => id.trim())
        )
      )
    : (initial.acknowledgedTravelLocationIds ?? []);

  const lastDailyXpDay = Math.max(
    1,
    Math.floor(
      typeof state.lastDailyXpDay === 'number'
        ? state.lastDailyXpDay === 0
          ? 1
          : state.lastDailyXpDay
        : initial.lastDailyXpDay
    )
  );

  const rawPlayDayRoll = (state as { playDayRollStaging?: unknown }).playDayRollStaging;
  let playDayRollStaging: PlayDayRollStaging | null = null;
  if (rawPlayDayRoll && typeof rawPlayDayRoll === 'object') {
    const row = rawPlayDayRoll as Record<string, unknown>;
    const phase = row.phase;
    const endingDay = row.endingDay;
    const nextDay = row.nextDay;
    const calendarDay = row.calendarDay;
    const sessionOnly = row.sessionOnly;
    const completedQuestId = row.completedQuestId;
    const prevRaw = row.prevForReport;
    if (
      (phase === 'await_continue' ||
        phase === 'before_report' ||
        phase === 'after_report') &&
      typeof endingDay === 'number' &&
      typeof nextDay === 'number' &&
      typeof calendarDay === 'number' &&
      typeof sessionOnly === 'boolean' &&
      typeof completedQuestId === 'string' &&
      completedQuestId.length > 0 &&
      prevRaw &&
      typeof prevRaw === 'object'
    ) {
      const prev = prevRaw as Record<string, unknown>;
      playDayRollStaging = {
        phase: 'await_continue',
        endingDay: Math.floor(endingDay),
        nextDay: Math.floor(nextDay),
        calendarDay: Math.floor(calendarDay),
        sessionOnly,
        completedQuestId,
        prevForReport: {
          modifiers:
            prev.modifiers && typeof prev.modifiers === 'object'
              ? (prev.modifiers as QuestState['modifiers'])
              : {},
          skills:
            prev.skills && typeof prev.skills === 'object'
              ? {
                  explorationXp: Math.max(0, Math.floor((prev.skills as { explorationXp?: number }).explorationXp ?? 0)),
                  foragingXp: Math.max(0, Math.floor((prev.skills as { foragingXp?: number }).foragingXp ?? 0)),
                  meleeAttackXp: Math.max(
                    0,
                    Math.floor((prev.skills as { meleeAttackXp?: number }).meleeAttackXp ?? 0)
                  ),
                }
              : createInitialSkills(),
          experience:
            typeof prev.experience === 'number' && Number.isFinite(prev.experience)
              ? Math.max(0, Math.floor(prev.experience))
              : 0,
          resources:
            prev.resources && typeof prev.resources === 'object'
              ? Object.fromEntries(
                  Object.entries(prev.resources as Record<string, unknown>).filter(
                    ([, v]) => typeof v === 'number' && Number.isFinite(v)
                  ) as [string, number][]
                )
              : undefined,
          dayReportModifierBaseline:
            prev.dayReportModifierBaseline && typeof prev.dayReportModifierBaseline === 'object'
              ? (prev.dayReportModifierBaseline as QuestState['modifiers'])
              : undefined,
          dayReportQuestItemsBaseline: Array.isArray(prev.dayReportQuestItemsBaseline)
            ? prev.dayReportQuestItemsBaseline.filter(
                (label): label is string => typeof label === 'string' && label.trim().length > 0
              )
            : [],
          questItems: Array.isArray(prev.questItems)
            ? prev.questItems.filter((label): label is string => typeof label === 'string' && label.trim().length > 0)
            : [],
          flags: Array.isArray(prev.flags)
            ? prev.flags.filter((f): f is string => typeof f === 'string')
            : [],
        },
      };
    }
  }

  return {
    ...initial,
    ...state,
    currentLocation,
    forestSubLocation,
    experience: legacyExperience,
    assignedRaceSlug,
    lockedClassSlug,
    flags,
    modifiers: normalizedModifiers,
    skills: {
      explorationXp,
      foragingXp,
      meleeAttackXp,
    },
    lastDailyXpDay,
    dialogueLog,
    worldEventLog,
    journalLog,
    questItems,
    unveiledQuestIds: migrated.unveiledQuestIds,
    progressByQuestId,
    activeQuestId: migrated.activeQuestId,
    playerName: resolvedPlayerName,
    health,
    characterCreationDateEastern,
    characterCreatedAtAppVersion,
    arenaRecord,
    guildMembership,
    lastWolfHideGrantDay,
    tavernEscrowByQuestId,
    marketEscrowByListingId,
    unlockedJobSlugs,
    activeJobSlug,
    jobDailyActionBySlug,
    resources,
    acknowledgedTravelLocationIds,
    playDayRollStaging,
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
 * `injury:*` modifiers unlock at magnitude **1** (severity labels: minor / moderate / severe).
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

export const getCompletedQuestIds = (state: QuestState): string[] =>
  Object.entries(state.progressByQuestId)
    .filter(([, progress]) => progress.isCompleted)
    .map(([questId]) => questId);

/** Character level = number of completed quests. */
export const getCharacterLevel = (state: QuestState): number => getCompletedQuestIds(state).length;

function mergeQuestProgressMaps(
  a: Record<string, QuestProgress>,
  b: Record<string, QuestProgress>
): Record<string, QuestProgress> {
  const out = { ...a };
  for (const [questId, pb] of Object.entries(b)) {
    const pa = out[questId];
    if (!pa) {
      out[questId] = pb;
      continue;
    }
    if (pa.isCompleted || pb.isCompleted) {
      out[questId] = {
        currentStepId: pa.isCompleted ? pa.currentStepId : pb.currentStepId,
        isCompleted: true,
        choiceHistory: pa.isCompleted ? pa.choiceHistory : pb.choiceHistory,
      };
    }
  }
  return out;
}

function mergeJobDailyActionMaps(
  a: QuestState['jobDailyActionBySlug'],
  b: QuestState['jobDailyActionBySlug']
): Record<string, { lastActionDay: number }> {
  const out: Record<string, { lastActionDay: number }> = { ...(a ?? {}) };
  for (const [slug, row] of Object.entries(b ?? {})) {
    const prev = out[slug]?.lastActionDay ?? 0;
    out[slug] = { lastActionDay: Math.max(prev, row.lastActionDay) };
  }
  return out;
}

function mergeResourceMaps(
  a: QuestState['resources'],
  b: QuestState['resources']
): Record<string, number> {
  const out: Record<string, number> = { ...(a ?? {}) };
  for (const [key, amount] of Object.entries(b ?? {})) {
    out[key] = Math.max(out[key] ?? 0, amount);
  }
  return out;
}

function pickMergedActiveJobSlug(relay: QuestState, local: QuestState, unlocked: string[]): string | null {
  for (const slug of [local.activeJobSlug, relay.activeJobSlug]) {
    if (
      typeof slug === 'string' &&
      slug.length > 0 &&
      slug !== JOB_SLUG_EXPLORER &&
      unlocked.includes(slug)
    ) {
      return slug;
    }
  }
  return null;
}

/** Higher = further along the forest / village arc (for picking relay vs local on hydrate). */
function questAdvanceScore(state: QuestState): number {
  const completed = getCompletedQuestIds(state).length;
  return completed * 1000 + state.unveiledQuestIds.length * 10 + state.lastDailyXpDay;
}

function pickMergedCharacterFields(relay: QuestState, local: QuestState) {
  const localAhead = questAdvanceScore(local) >= questAdvanceScore(relay);
  const preferred = localAhead ? local : relay;
  const dialogueSource = local.dialogueLog.length >= relay.dialogueLog.length ? local : relay;
  const journalSource = local.journalLog.length >= relay.journalLog.length ? local : relay;
  const playerName = local.playerName.trim() || relay.playerName.trim() || '';
  return {
    playerName,
    characterCreationDateEastern:
      local.characterCreationDateEastern ?? relay.characterCreationDateEastern,
    characterCreatedAtAppVersion:
      local.characterCreatedAtAppVersion ?? relay.characterCreatedAtAppVersion,
    lastDailyXpDay: Math.max(relay.lastDailyXpDay, local.lastDailyXpDay),
    activeQuestId: preferred.activeQuestId ?? (localAhead ? relay.activeQuestId : local.activeQuestId),
    dialogueLog: dialogueSource.dialogueLog,
    journalLog: journalSource.journalLog,
    experience: Math.max(relay.experience, local.experience),
    health: Math.max(relay.health, local.health),
    skills: {
      explorationXp: Math.max(relay.skills.explorationXp, local.skills.explorationXp),
      foragingXp: Math.max(relay.skills.foragingXp, local.skills.foragingXp),
      meleeAttackXp: Math.max(relay.skills.meleeAttackXp, local.skills.meleeAttackXp),
    },
  };
}

/** Union flags, unveiled ids, quest completions, and job state from relay + local saves on login. */
export function mergeQuestStateOnHydrate(relay: QuestState, local: QuestState): QuestState {
  const unlockedJobSlugs = Array.from(
    new Set([...(relay.unlockedJobSlugs ?? []), ...(local.unlockedJobSlugs ?? [])])
  ).filter((slug) => slug !== JOB_SLUG_EXPLORER);

  const currentLocation = VALID_SAVE_LOCATIONS.has(local.currentLocation)
    ? local.currentLocation
    : VALID_SAVE_LOCATIONS.has(relay.currentLocation)
      ? relay.currentLocation
      : createInitialQuestState().currentLocation;
  const forestSubLocation =
    typeof local.forestSubLocation === 'string'
      ? local.forestSubLocation
      : typeof relay.forestSubLocation === 'string'
        ? relay.forestSubLocation
        : null;

  const merged = normalizeQuestState({
    ...relay,
    ...pickMergedCharacterFields(relay, local),
    flags: Array.from(new Set([...relay.flags, ...local.flags])),
    unveiledQuestIds: Array.from(new Set([...relay.unveiledQuestIds, ...local.unveiledQuestIds])),
    progressByQuestId: mergeQuestProgressMaps(relay.progressByQuestId, local.progressByQuestId),
    currentLocation,
    forestSubLocation,
    unlockedJobSlugs,
    activeJobSlug: pickMergedActiveJobSlug(relay, local, unlockedJobSlugs),
    jobDailyActionBySlug: mergeJobDailyActionMaps(
      relay.jobDailyActionBySlug,
      local.jobDailyActionBySlug
    ),
    resources: mergeResourceMaps(relay.resources, local.resources),
  });
  return reconcileVillagePhaseState(merged);
}

/** Prefer the more advanced save when both relay and localStorage have checkpoints. */
export function hydrateQuestStateFromSources(
  relay: QuestState | null,
  local: QuestState | null
): QuestState {
  if (relay && local) return mergeQuestStateOnHydrate(relay, local);
  if (relay) return reconcileVillagePhaseState(normalizeQuestState(relay));
  if (local) return reconcileVillagePhaseState(normalizeQuestState(local));
  return createInitialQuestState();
}

/**
 * After village arrival, keep endgame flag and hub location across logins
 * (relay checkpoint can lag behind localStorage).
 */
export const isDayPacingActive = (flags: readonly string[]): boolean =>
  flags.includes(DAY_PACING_ACTIVE_FLAG);

export const isVillagePhase = (flags: readonly string[]): boolean =>
  flags.includes(VILLAGE_PHASE_FLAG);

/** Forest arc: in-session day counter (`lastDailyXpDay`), not Eastern calendar. */
export function resolveDisplayDay(state: QuestState, calendarDay: number): number {
  if (isVillagePhase(state.flags)) {
    return isDayPacingActive(state.flags)
      ? Math.max(1, state.lastDailyXpDay)
      : Math.max(1, Math.floor(calendarDay));
  }
  return Math.max(1, state.lastDailyXpDay);
}

export function shouldShowDayInHeader(state: QuestState): boolean {
  if (isVillagePhase(state.flags)) return isDayPacingActive(state.flags);
  return true;
}

/**
 * When calendar pacing first activates, anchor daily XP to the current Eastern day
 * so forest binge time does not grant retroactive catch-up.
 */
export const applyDayPacingActivation = (
  state: QuestState,
  calendarDay: number,
  previousFlags?: readonly string[]
): QuestState => {
  const hadPacing = previousFlags
    ? isDayPacingActive(previousFlags)
    : false;
  if (hadPacing || !isDayPacingActive(state.flags)) return state;
  const day = Math.max(1, Math.floor(calendarDay));
  return { ...state, lastDailyXpDay: day };
};

/** Unveils and starts The Village quest after The Door (travel unlocks when that quest completes). */
export function introduceVillageQuestAfterTheDoor(state: QuestState): QuestState {
  const quest = questById[QUEST_VILLAGE_ARRIVAL_ID];
  if (!quest) return state;
  if (getCompletedQuestIds(state).includes(QUEST_VILLAGE_ARRIVAL_ID)) return state;

  let next = state;
  if (!next.unveiledQuestIds.includes(QUEST_VILLAGE_ARRIVAL_ID)) {
    next = {
      ...next,
      unveiledQuestIds: [...next.unveiledQuestIds, QUEST_VILLAGE_ARRIVAL_ID],
    };
  }
  const progress = next.progressByQuestId[QUEST_VILLAGE_ARRIVAL_ID];
  if (!progress || progress.isCompleted) {
    next = startQuest(ensureQuestProgress(next, quest), quest);
  }
  return next;
}

/** Unveils and starts the Mayor quest after Pick a job (vote at Town Hall completes it). */
export function introduceMayorQuestAfterPickJob(state: QuestState): QuestState {
  const quest = questById[QUEST_MAYOR_ID];
  if (!quest) return state;
  if (getCompletedQuestIds(state).includes(QUEST_MAYOR_ID)) return state;
  if (!getCompletedQuestIds(state).includes(QUEST_PICK_A_JOB_ID)) return state;

  let next = state;
  if (!next.unveiledQuestIds.includes(QUEST_MAYOR_ID)) {
    next = {
      ...next,
      unveiledQuestIds: [...next.unveiledQuestIds, QUEST_MAYOR_ID],
    };
  }
  const progress = next.progressByQuestId[QUEST_MAYOR_ID];
  if (!progress || progress.isCompleted) {
    next = startQuest(ensureQuestProgress(next, quest), quest);
  }
  return next;
}

/** Saves that finished The Door before The Village quest was unveiled. */
export function catchUpVillageQuestAfterTheDoor(state: QuestState): QuestState {
  if (getCompletedQuestIds(state).includes(QUEST_VILLAGE_ARRIVAL_ID)) return state;
  if (!getCompletedQuestIds(state).includes(QUEST_004_B_THE_DOOR_ID)) return state;
  if (state.unveiledQuestIds.includes(QUEST_VILLAGE_ARRIVAL_ID)) return state;
  return introduceVillageQuestAfterTheDoor(state);
}

export function reconcileVillagePhaseState(state: QuestState, calendarDay?: number): QuestState {
  const completed = new Set(getCompletedQuestIds(state));
  const hasVillageQuest = completed.has(QUEST_VILLAGE_ARRIVAL_ID);
  const hasVillageFlag = state.flags.includes(VILLAGE_PHASE_FLAG);
  if (!hasVillageQuest && !hasVillageFlag) return state;

  let flags = hasVillageFlag
    ? [...state.flags]
    : Array.from(new Set([...state.flags, VILLAGE_PHASE_FLAG]));
  const hadPacing = isDayPacingActive(flags);
  if (!hadPacing) {
    flags = Array.from(new Set([...flags, DAY_PACING_ACTIVE_FLAG]));
  }
  const currentLocation = VALID_SAVE_LOCATIONS.has(state.currentLocation)
    ? state.currentLocation
    : 'Village';

  const unlockedJobSlugs: string[] = [...VILLAGE_CHOOSEABLE_JOB_SLUGS];
  const activeJobSlug =
    state.activeJobSlug &&
    state.activeJobSlug !== JOB_SLUG_EXPLORER &&
    unlockedJobSlugs.includes(state.activeJobSlug)
      ? state.activeJobSlug
      : null;

  let next: QuestState = {
    ...state,
    flags,
    currentLocation,
    unlockedJobSlugs,
    activeJobSlug,
  };
  if (!hadPacing && calendarDay !== undefined) {
    next = applyDayPacingActivation(next, calendarDay, state.flags);
  } else if (!hadPacing) {
    next = applyDayPacingActivation(next, Math.max(1, state.lastDailyXpDay), state.flags);
  }

  if (
    next.flags === state.flags &&
    next.currentLocation === state.currentLocation &&
    next.lastDailyXpDay === state.lastDailyXpDay &&
    next.unlockedJobSlugs === state.unlockedJobSlugs &&
    next.activeJobSlug === state.activeJobSlug
  ) {
    return state;
  }
  return next;
}

export const getQuestContext = (state: QuestState, currentDay: number): QuestContext => ({
  currentLocation: state.currentLocation,
  forestSubLocation: state.forestSubLocation ?? null,
  completedQuestIds: getCompletedQuestIds(state),
  flags: state.flags,
  explorationLevel: getLevelFromXp(state.skills.explorationXp),
  foragingLevel: getLevelFromXp(state.skills.foragingXp),
  meleeAttackLevel: getLevelFromXp(state.skills.meleeAttackXp),
  characterLevel: getCharacterLevel(state),
  assignedRaceSlug: state.assignedRaceSlug ?? null,
  lockedClassSlug: state.lockedClassSlug ?? null,
  dayPacingActive: isDayPacingActive(state.flags),
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
  const completedSet = new Set(context.completedQuestIds);
  return quests
    .filter((quest) => {
      if (completedSet.has(quest.id)) return true;
      if (!unveiledSet.has(quest.id)) return false;
      return isQuestEligibleForUnveil(quest, context);
    })
    .sort((a, b) => b.createdAt - a.createdAt);
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
  // Temporary manual quest gating: UI should respect unveiled/completed only.
  return getPlayerVisibleQuests(quests, context, unveiledQuestIds);
};

/** Mark a quest complete without walking choice resolution (external triggers). */
export function markQuestCompleted(state: QuestState, questId: string): QuestState | null {
  const prog = state.progressByQuestId[questId];
  if (!prog || prog.isCompleted) return null;
  return {
    ...state,
    activeQuestId: state.activeQuestId === questId ? null : state.activeQuestId,
    progressByQuestId: {
      ...state.progressByQuestId,
      [questId]: { ...prog, isCompleted: true },
    },
  };
};

/** Forest mainline order for auto-track after unveil (Play tab quest card + inline choices). */
const FOREST_AUTO_TRACK_QUEST_IDS: readonly string[] = [
  QUEST_ORIGIN_ID,
  QUEST_FIRST_NIGHT_ID,
  QUEST_DYERS_CRYPT_ID,
  'quest-004-abandoned-shelter',
  QUEST_DAY_TWO_DREAM_ID,
  QUEST_FOREST_CAVE_ID,
  QUEST_004_B_THE_DOOR_ID,
];

/**
 * When nothing is in progress, start the first unveiled, incomplete forest beat so Play always
 * offers choices (e.g. after Day 1 Report / Sunset).
 */
export function offerNextTrackedForestQuest(state: QuestState, context: QuestContext): QuestState {
  if (isForestAutoTrackBlockedByDayRoll(state)) return state;
  if (isVillagePhase(state.flags)) return state;
  const activeId = state.activeQuestId;
  if (activeId) {
    const prog = state.progressByQuestId[activeId];
    if (prog && !prog.isCompleted) return state;
  }
  const completed = new Set(context.completedQuestIds);
  const unveiled = new Set(state.unveiledQuestIds);
  for (const questId of FOREST_AUTO_TRACK_QUEST_IDS) {
    if (!unveiled.has(questId) || completed.has(questId)) continue;
    const quest = questById[questId];
    if (!quest) continue;
    if (!isQuestEligibleForUnveil(quest, context)) continue;
    return startQuest(state, quest);
  }
  return state;
};

/** First step when opening a quest (honors `resolveInitialStepId` when present). */
export const resolveQuestEntryStepId = (quest: QuestDefinition, state: QuestState): string => {
  const resolved = quest.resolveInitialStepId?.(state);
  if (resolved && quest.steps[resolved]) return resolved;
  return quest.startStepId;
};

export const ensureQuestProgress = (state: QuestState, quest: QuestDefinition): QuestState => {
  if (state.progressByQuestId[quest.id]) return state;

  const nextProgress: QuestProgress = {
    currentStepId: resolveQuestEntryStepId(quest, state),
    isCompleted: false,
    choiceHistory: [],
    devStepHistory: [],
    modifiersAtQuestOpen: { ...state.modifiers },
  };

  return {
    ...state,
    progressByQuestId: {
      ...state.progressByQuestId,
      [quest.id]: nextProgress,
    },
  };
};

/** Persist modifier map when a quest completes (used by dev Restart From rewind). */
export const recordModifiersAfterQuestComplete = (
  state: QuestState,
  questId: string
): QuestState => ({
  ...state,
  modifiersAfterQuestComplete: {
    ...(state.modifiersAfterQuestComplete ?? {}),
    [questId]: { ...state.modifiers },
  },
});

/** Reconcile class lock after dev rewind; clears lock when no path reaches threshold. */
export const resyncCharacterLocksAfterModifierRewind = (state: QuestState): QuestState => {
  const lockedClassSlug = pickDominantLockedSlug(state.modifiers);
  if (!lockedClassSlug) {
    return { ...state, lockedClassSlug: null };
  }
  return {
    ...state,
    lockedClassSlug,
    modifiers: stripNonLockedClassModifiers(state.modifiers, lockedClassSlug),
  };
};

export const startQuest = (state: QuestState, quest: QuestDefinition): QuestState => {
  const withProgress = ensureQuestProgress(state, quest);

  return {
    ...withProgress,
    activeQuestId: quest.id,
  };
};

/** Reopen a completed (or in-progress) location scene at a given step; keeps `isCompleted` for saga gates. */
export const resumeLocationQuestAtStep = (
  state: QuestState,
  quest: QuestDefinition,
  stepId: string
): QuestState => {
  const withProgress = ensureQuestProgress(state, quest);
  const existing = withProgress.progressByQuestId[quest.id];
  if (!existing) {
    return startQuest(withProgress, quest);
  }
  return {
    ...withProgress,
    activeQuestId: quest.id,
    progressByQuestId: {
      ...withProgress.progressByQuestId,
      [quest.id]: {
        ...existing,
        currentStepId: stepId,
      },
    },
  };
};

/** Reset quest progress so a location scene can be replayed (repeatable ambient quests). */
export const restartQuestProgress = (state: QuestState, quest: QuestDefinition): QuestState => ({
  ...state,
  progressByQuestId: {
    ...state.progressByQuestId,
    [quest.id]: {
      currentStepId: resolveQuestEntryStepId(quest, state),
      isCompleted: false,
      choiceHistory: [],
      devStepHistory: [],
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
  let stepId = progress?.currentStepId ?? resolveQuestEntryStepId(quest, state);
  if (quest.id === QUEST_FIRST_NIGHT_ID && !quest.steps[stepId]) {
    stepId = 'night-router';
  }
  if (!quest.steps[stepId]) {
    stepId = quest.startStepId;
  }
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

/** Apply HP changes from quest choice / message `effects`. */
export const applyHealthFromChoiceEffect = (state: QuestState, effect?: ChoiceEffect): QuestState => {
  if (!effect) return state;
  let health = state.health;
  if (typeof effect.healthLossFraction === 'number' && Number.isFinite(effect.healthLossFraction)) {
    const fraction = Math.max(0, Math.min(1, effect.healthLossFraction));
    if (fraction > 0) {
      health = Math.max(0, Math.floor(health * (1 - fraction)));
    }
  }
  if (typeof effect.healthDelta === 'number' && Number.isFinite(effect.healthDelta)) {
    health = Math.max(0, Math.min(100, Math.floor(health + effect.healthDelta)));
  }
  return health === state.health ? state : { ...state, health };
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
      atMs: existing.atMs,
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
  let resolvedNextStepId = choice.nextStepId ?? currentStepId;
  if (!clearActive && choice.randomBranch) {
    const p = choice.randomBranch.probability ?? 0.5;
    resolvedNextStepId =
      Math.random() < p
        ? choice.randomBranch.successStepId
        : choice.randomBranch.failStepId;
  }
  const nextStepId = clearActive ? quest.startStepId : resolvedNextStepId;
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
      [quest.id]: pushDevStepHistory(
        {
          currentStepId: nextStepId,
          isCompleted,
          choiceHistory: clearActive
            ? []
            : [...(currentProgress?.choiceHistory ?? []), choice.id],
          devStepHistory: clearActive ? [] : currentProgress?.devStepHistory,
        },
        currentStepId
      ),
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
    nextState = applyTravelLocationChange(nextState, travelTo);
  }

  const jobsToUnlock = choice.effects?.unlockJobSlugs;
  if (jobsToUnlock?.length) {
    for (const slug of jobsToUnlock) {
      if (typeof slug === 'string' && slug.trim().length > 0) {
        nextState = unlockJobSlug(nextState, slug.trim());
      }
    }
  }

  nextState = applyHealthFromChoiceEffect(nextState, choice.effects);

  const entryStepId = clearActive ? quest.startStepId : nextStepId;
  nextState = autoAdvanceContinueBridgeSteps(nextState, quest);
  return applyLastBeatResponse(nextState, quest, entryStepId);
};

/** Skip `message` steps that only bridge to the next beat (no Continue tap). */
export const autoAdvanceContinueBridgeSteps = (
  state: QuestState,
  quest: QuestDefinition
): QuestState => {
  let next = state;
  for (let i = 0; i < 32; i++) {
    const step = getCurrentStep(next, quest);
    if (!isContinueBridgeMessageStep(step)) break;
    const advanced = advanceQuestMessage(next, quest);
    if (!advanced) break;
    next = advanced;
  }
  return next;
};

export type QuestSceneTextBands = {
  /** Outcome / narration from the latest choice (bridge messages). */
  response: string;
  /** Current step prompt (e.g. hub question). */
  prompt: string;
};

const formatBeatResponseRaw = (
  quest: QuestDefinition,
  startStepId: string,
  endStepId: string
): string =>
  collectContinueBridgeChainTexts(quest, startStepId, endStepId)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .join('\n\n');

const applyLastBeatResponse = (
  state: QuestState,
  quest: QuestDefinition,
  entryStepId: string
): QuestState => {
  const progress = state.progressByQuestId[quest.id];
  if (!progress) return state;
  const finalStepId = getCurrentStep(state, quest).id;
  const lastBeatResponse = formatBeatResponseRaw(quest, entryStepId, finalStepId);
  return {
    ...state,
    progressByQuestId: {
      ...state.progressByQuestId,
      [quest.id]: {
        ...progress,
        lastBeatResponse: lastBeatResponse.length > 0 ? lastBeatResponse : undefined,
      },
    },
  };
};

/** Quest scene dialogue box: latest outcome plus current step prompt. */
export const resolveQuestSceneTextBands = (
  quest: QuestDefinition,
  step: QuestStep,
  progress: QuestProgress | undefined,
  playerName: string,
  extras?: Record<string, string>
): QuestSceneTextBands => {
  const response = progress?.lastBeatResponse
    ? interpolateStepText(progress.lastBeatResponse, playerName, extras)
    : '';
  let prompt = '';
  if (step.type === 'choice' && step.text.trim().length > 0) {
    prompt = interpolateStepText(step.text.trim(), playerName, extras);
  } else if (step.type === 'message' && step.text.trim().length > 0) {
    prompt = interpolateStepText(step.text.trim(), playerName, extras);
  }
  if (response.length > 0 || prompt.length > 0) {
    return { response, prompt };
  }
  if (step.type !== 'choice') return { response: '', prompt: '' };
  const inbound = Object.values(quest.steps)
    .filter(
      (s): s is MessageQuestStep =>
        isContinueBridgeMessageStep(s) && s.nextStepId === step.id
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const fallback = inbound
    .map((s) => interpolateStepText(s.text.trim(), playerName, extras))
    .filter((t) => t.length > 0)
    .join('\n\n');
  return { response: fallback, prompt: '' };
};

/** Combined narrative for popups and legacy callers. */
export const resolveQuestStepNarrativeText = (
  quest: QuestDefinition,
  step: QuestStep,
  playerName: string,
  extras?: Record<string, string>,
  progress?: QuestProgress
): string => {
  const { response, prompt } = resolveQuestSceneTextBands(quest, step, progress, playerName, extras);
  return [response, prompt].filter((t) => t.length > 0).join('\n\n');
};

/** Texts of bridge `message` steps walked when advancing from `startStepId` to `endStepId`. */
export const collectContinueBridgeChainTexts = (
  quest: QuestDefinition,
  startStepId: string,
  endStepId: string
): string[] => {
  const texts: string[] = [];
  let id = startStepId;
  for (let guard = 0; guard < 32 && id !== endStepId; guard++) {
    const step = quest.steps[id];
    if (!step || !isContinueBridgeMessageStep(step)) break;
    const t = step.text.trim();
    if (t) texts.push(t);
    const next = step.nextStepId?.trim();
    if (!next) break;
    id = next;
  }
  return texts;
};

const finalizeChoiceState = (
  state: QuestState,
  previousFlags: readonly string[],
  calendarDay?: number
): QuestState => {
  let next = reconcileVillagePhaseState(state, calendarDay);
  if (calendarDay !== undefined) {
    next = applyDayPacingActivation(next, calendarDay, previousFlags);
  }
  return next;
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

const applyMessageStepEffects = (state: QuestState, effects: ChoiceEffect | undefined): QuestState => {
  if (!effects) return state;
  let nextState: QuestState = {
    ...state,
    flags: mergeFlags(state.flags, effects),
    questItems: mergeQuestItems(state.questItems, effects),
  };
  const raceLocked = state.assignedRaceSlug !== null;
  nextState = {
    ...nextState,
    modifiers: mergeModifiers(
      nextState.modifiers,
      effects.modifiersDelta,
      raceLocked,
      state.lockedClassSlug
    ),
  };
  const travelTo = effects.setCurrentLocation?.trim();
  if (travelTo && VALID_SAVE_LOCATIONS.has(travelTo)) {
    nextState = applyTravelLocationChange(nextState, travelTo);
  }
  const jobsToUnlock = effects.unlockJobSlugs;
  if (jobsToUnlock?.length) {
    for (const slug of jobsToUnlock) {
      if (typeof slug === 'string' && slug.trim().length > 0) {
        nextState = unlockJobSlug(nextState, slug.trim());
      }
    }
  }
  nextState = applyHealthFromChoiceEffect(nextState, effects);
  return nextState;
};

/**
 * Advance past a mid-quest `message` step that has `nextStepId` (Continue-style narration bridges).
 * Marks completion when landing on a terminal `message` step with `completeQuest`.
 */
export const advanceQuestMessage = (state: QuestState, quest: QuestDefinition): QuestState | null => {
  const withProgress = ensureQuestProgress(state, quest);
  const progress = withProgress.progressByQuestId[quest.id];
  if (!progress || (progress.isCompleted && !quest.locationRepeats)) return null;
  const step = quest.steps[progress.currentStepId];
  if (!step || step.type !== 'message') return null;
  if (step.completeQuest) return null;
  const nextId = step.nextStepId;
  if (!nextId || !quest.steps[nextId]) return null;
  const nextStep = quest.steps[nextId];
  const completesHere = nextStep.type === 'message' && Boolean(nextStep.completeQuest);
  const previousFlags = state.flags;
  let nextState: QuestState = {
    ...withProgress,
    activeQuestId: completesHere ? null : withProgress.activeQuestId,
    progressByQuestId: {
      ...withProgress.progressByQuestId,
      [quest.id]: pushDevStepHistory(
        {
          ...progress,
          currentStepId: nextId,
          isCompleted: completesHere,
          choiceHistory: progress.choiceHistory,
        },
        progress.currentStepId
      ),
    },
  };
  nextState = applyMessageStepEffects(nextState, step.effects);
  if (completesHere && nextStep.type === 'message') {
    nextState = applyMessageStepEffects(nextState, nextStep.effects);
  }
  const entryStepId = progress.currentStepId;
  nextState = finalizeChoiceState(nextState, previousFlags);
  return applyLastBeatResponse(nextState, quest, entryStepId);
};

export const applyChoice = (
  state: QuestState,
  quest: QuestDefinition,
  choiceId: string,
  calendarDay?: number
): QuestState => {
  const withProgress = ensureQuestProgress(state, quest);
  const currentStep = getCurrentStep(withProgress, quest);

  if (currentStep.type !== 'choice') return withProgress;

  const selectedChoice = currentStep.choices.find((choice) => choice.id === choiceId);
  if (!selectedChoice) return withProgress;

  const previousFlags = state.flags;
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
  return finalizeChoiceState(nextState, previousFlags, calendarDay);
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

  const priorProgress = withProgress.progressByQuestId[quest.id] ?? {
    currentStepId: quest.startStepId,
    isCompleted: false,
    choiceHistory: [],
    devStepHistory: [],
  };

  let nextState: QuestState = {
    ...withProgress,
    playerName: trimmed,
    progressByQuestId: {
      ...withProgress.progressByQuestId,
      [quest.id]: pushDevStepHistory(
        {
          ...priorProgress,
          currentStepId: currentStep.nextStepId ?? currentStep.id,
        },
        priorProgress.currentStepId
      ),
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

export const interpolateStepText = (
  text: string,
  playerName: string,
  extras?: Record<string, string>
): string => {
  let out = text.replaceAll('{playerName}', playerName.trim() || 'Stranger');
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      out = out.replaceAll(`{${key}}`, value);
    }
  }
  return out;
};

function removeOneQuestItem(items: readonly string[], label: string): string[] {
  const idx = items.indexOf(label);
  if (idx < 0) return [...items];
  return [...items.slice(0, idx), ...items.slice(idx + 1)];
}

/** Submit an `inventoryPick` step: consume one `questItems` label and advance. */
export const submitQuestInventoryPick = (
  state: QuestState,
  quest: QuestDefinition,
  itemLabel: string,
  calendarDay?: number
): { nextState: QuestState; error?: string } => {
  const withProgress = ensureQuestProgress(state, quest);
  const currentStep = getCurrentStep(withProgress, quest);
  if (currentStep.type !== 'inventoryPick') {
    return { nextState: withProgress };
  }

  const trimmed = itemLabel.trim();
  if (!trimmed || !withProgress.questItems.includes(trimmed)) {
    return { nextState: withProgress, error: 'Choose an item from your inventory.' };
  }

  const currentProgress = withProgress.progressByQuestId[quest.id];
  const nextStepId = currentStep.nextStepId;
  const nextStep = quest.steps[nextStepId];
  const previousFlags = withProgress.flags;

  const pickFlags = [...(currentStep.effects?.flagsSet ?? [])];
  if (currentStep.thrownItemFlagPrefix && trimmed.length > 0) {
    pickFlags.push(`${currentStep.thrownItemFlagPrefix}${trimmed}`);
  }

  const mergedFlags = mergeFlags(withProgress.flags, {
    ...currentStep.effects,
    flagsSet: pickFlags,
  });

  const isCompleted = Boolean(nextStep?.completeQuest);
  const nextProgress: QuestProgress = {
    currentStepId: nextStepId,
    isCompleted,
    choiceHistory: [...(currentProgress?.choiceHistory ?? []), `inventory-pick:${trimmed}`],
    devStepHistory: currentProgress?.devStepHistory,
  };

  let nextState: QuestState = {
    ...withProgress,
    activeQuestId: isCompleted ? null : withProgress.activeQuestId,
    flags: mergedFlags,
    questItems: removeOneQuestItem(withProgress.questItems, trimmed),
    progressByQuestId: {
      ...withProgress.progressByQuestId,
      [quest.id]: pushDevStepHistory(nextProgress, currentProgress?.currentStepId ?? quest.startStepId),
    },
  };

  nextState = appendJournalSummaryLine(
    nextState,
    quest.id,
    `You threw a ${trimmed} into the well.`,
    nextState.playerName
  );

  nextState = autoAdvanceContinueBridgeSteps(nextState, quest);
  nextState = applyLastBeatResponse(nextState, quest, nextStepId);

  return { nextState: finalizeChoiceState(nextState, previousFlags, calendarDay) };
};
