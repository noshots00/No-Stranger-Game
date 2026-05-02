import type {
  ChoiceEffect,
  DialogueLogEntry,
  ModifierMap,
  QuestChoice,
  QuestContext,
  QuestDefinition,
  QuestProgress,
  QuestState,
  QuestStep,
  WorldEventLogEntry,
} from './types';
import {
  appendUniqueWorldEntries,
  collectChoiceWorldLogLines,
  interpolateQuestWorldLogTemplates,
} from '../worldLog';
import { canonicalizeModifierMap, migrateModifiersToCanonical } from '../modifiers/canonical';
import { SKILL_EVENT_LABEL, SKILL_XP_KEYS } from './skills-config';
import { LEGACY_RACE_SLUG_REWRITES, getRaceDefinition, type RaceDefinition } from '../races';

const parseTimestampFromDialogueId = (id: string): number | null => {
  const m = id.match(/-(\d{10,16})-[a-z0-9]+$/i);
  if (!m) return null;
  return Number(m[1]);
};

const normalizeDialogueLog = (entries: unknown): DialogueLogEntry[] => {
  if (!Array.isArray(entries)) return [];
  const now = Date.now();
  return entries.map((entry, index) => {
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
    return { id, speaker, text, atMs };
  });
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
  questItems: [],
  assignedRaceSlug: null,
  unveiledQuestIds: ['quest-001-origin'],
  health: 75,
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
  const questItemsRaw = state.questItems;
  const questItems = Array.isArray(questItemsRaw)
    ? questItemsRaw.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];
  const currentLocation =
    typeof state.currentLocation === 'string' && state.currentLocation.trim().length > 0
      ? state.currentLocation
      : initial.currentLocation;

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

  return {
    ...initial,
    ...state,
    currentLocation,
    experience: legacyExperience,
    assignedRaceSlug,
    modifiers: migrateModifiersToCanonical(rawModifiers),
    skills: {
      explorationXp,
      foragingXp,
      meleeAttackXp,
    },
    lastDailyXpDay:
      typeof state.lastDailyXpDay === 'number'
        ? state.lastDailyXpDay === 0
          ? 1
          : state.lastDailyXpDay
        : initial.lastDailyXpDay,
    dialogueLog,
    worldEventLog,
    questItems,
    unveiledQuestIds,
    health,
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
 * Pending-but-not-yet-unveiled quests are hidden until day-rollover unveils them.
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
  raceLocked: boolean
): ModifierMap => {
  if (!incoming) return current;
  let normalizedIncoming = canonicalizeModifierMap(incoming);
  if (raceLocked) {
    normalizedIncoming = Object.fromEntries(
      Object.entries(normalizedIncoming).filter(([modifier]) => !modifier.startsWith('race:'))
    );
  }
  const next = { ...current };
  Object.entries(normalizedIncoming).forEach(([modifier, delta]) => {
    next[modifier] = (next[modifier] ?? 0) + delta;
  });
  return next;
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

  let nextState: QuestState = {
    ...state,
    activeQuestId: isCompleted || clearActive ? null : state.activeQuestId,
    modifiers: mergeModifiers(state.modifiers, choice.effects?.modifiersDelta, raceLocked),
    flags: mergedFlags,
    questItems: mergeQuestItems(state.questItems, choice.effects),
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
        nextState = applyRaceLockEffects(nextState, race);
      } else {
        nextState = { ...nextState, assignedRaceSlug: slug };
      }
    }
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
const applyRaceLockEffects = (state: QuestState, race: RaceDefinition): QuestState => {
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

  const worldLine = `A ${race.displayName} stares back from the water.`;
  const worldEventLog = appendUniqueWorldEntries(state.worldEventLog, [worldLine]);

  return {
    ...state,
    assignedRaceSlug: race.slug,
    modifiers: mergedModifiers,
    worldEventLog,
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
        currentStepId: currentStep.nextStepId,
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

  return { nextState };
};

export const interpolateStepText = (text: string, playerName: string): string =>
  text.replace('{playerName}', playerName || 'Stranger');
