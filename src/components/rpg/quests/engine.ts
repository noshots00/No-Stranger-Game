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
import { SKILL_EVENT_LABEL, SKILL_XP_KEYS } from './skills-config';

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
  const currentLocation =
    typeof state.currentLocation === 'string' && state.currentLocation.trim().length > 0
      ? state.currentLocation
      : initial.currentLocation;

  return {
    ...initial,
    ...state,
    currentLocation,
    experience: legacyExperience,
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
  };
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

export const getCharacterLevel = (state: QuestState): number => getLevelFromXp(state.skills.explorationXp);

export const getCompletedQuestIds = (state: QuestState): string[] =>
  Object.entries(state.progressByQuestId)
    .filter(([, progress]) => progress.isCompleted)
    .map(([questId]) => questId);

export const getQuestContext = (state: QuestState): QuestContext => ({
  currentLocation: state.currentLocation,
  completedQuestIds: getCompletedQuestIds(state),
  flags: state.flags,
  explorationLevel: getLevelFromXp(state.skills.explorationXp),
  foragingLevel: getLevelFromXp(state.skills.foragingXp),
  meleeAttackLevel: getLevelFromXp(state.skills.meleeAttackXp),
});

export const getVisibleQuests = (quests: QuestDefinition[], context: QuestContext): QuestDefinition[] =>
  quests
    .filter((quest) => quest.isAvailable(context) || context.completedQuestIds.includes(quest.id))
    .sort((a, b) => b.createdAt - a.createdAt);

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

export const getCurrentStep = (state: QuestState, quest: QuestDefinition): QuestStep => {
  const progress = state.progressByQuestId[quest.id];
  const stepId = progress?.currentStepId ?? quest.startStepId;
  return quest.steps[stepId];
};

const mergeModifiers = (current: ModifierMap, incoming: ModifierMap | undefined): ModifierMap => {
  if (!incoming) return current;
  const next = { ...current };
  Object.entries(incoming).forEach(([modifier, delta]) => {
    next[modifier] = (next[modifier] ?? 0) + delta;
  });
  return next;
};

const mergeFlags = (current: string[], effect: ChoiceEffect | undefined): string[] => {
  const flags = effect?.flagsSet ?? [];
  if (flags.length === 0) return current;
  return Array.from(new Set([...current, ...flags]));
};

const moveToStep = (
  state: QuestState,
  quest: QuestDefinition,
  choice: QuestChoice,
  currentStepId: string
): QuestState => {
  const currentProgress = state.progressByQuestId[quest.id];
  const nextStepId = choice.nextStepId ?? currentStepId;
  const nextStep = quest.steps[nextStepId];
  const isCompleted = Boolean(choice.completeQuest || nextStep?.completeQuest);

  return {
    ...state,
    activeQuestId: isCompleted ? null : state.activeQuestId,
    modifiers: mergeModifiers(state.modifiers, choice.effects?.modifiersDelta),
    flags: mergeFlags(state.flags, choice.effects),
    progressByQuestId: {
      ...state.progressByQuestId,
      [quest.id]: {
        currentStepId: nextStepId,
        isCompleted,
        choiceHistory: [...(currentProgress?.choiceHistory ?? []), choice.id],
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

  return moveToStep(withProgress, quest, selectedChoice, currentStep.id);
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

  return {
    nextState: {
      ...withProgress,
      playerName: trimmed,
      progressByQuestId: {
        ...withProgress.progressByQuestId,
        [quest.id]: {
          ...withProgress.progressByQuestId[quest.id],
          currentStepId: currentStep.nextStepId,
        },
      },
    },
  };
};

export const interpolateStepText = (text: string, playerName: string): string =>
  text.replace('{playerName}', playerName || 'Stranger');
