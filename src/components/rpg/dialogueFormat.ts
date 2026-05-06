import type {
  DialogueLogEntry,
  JournalLogEntry,
  QuestDefinition,
  QuestVisualBeat,
  WorldEventLogEntry,
} from './quests/types';

export const PLAYER_ACTION_SPEAKER = 'PlayerAction';
export const QUEST_DIVIDER_SPEAKER = 'QuestDivider';
export const QUEST_IMAGE_SPEAKER = 'QuestImage';
export const QUEST_VISUAL_SPEAKER = 'QuestVisual';
/** Play-only recap lines (quest path summaries); omitted from Chronicle merge. */
export const JOURNAL_RECAP_SPEAKER = 'Journal recap';
/** Speaker id for end-of-day summary blocks (grouped as `report` voice). */
export const DAY_REPORT_SPEAKER = 'Day Report';

/** Report-block titles (same voice as daily report) for milestone infographics. */
export const CLASS_LOCK_REPORT_TITLE = 'Path secured';
export const RACE_LOCK_REPORT_TITLE = 'The lake answers';

/** True when the log already ends with the standard quest opening (legacy/portrait or structured visuals + first narrator line). */
export function dialogueHasQuestOpeningAtEnd(
  log: DialogueLogEntry[],
  questTitle: string,
  openingNarratorText: string
): boolean {
  if (log.length < 2) return false;
  const narratorEntry = log[log.length - 1];
  if (narratorEntry.speaker !== 'Narrator' || narratorEntry.text !== openingNarratorText) return false;
  const prev = log[log.length - 2];
  if (!prev) return false;
  return (
    (prev.speaker === QUEST_IMAGE_SPEAKER && prev.text === questTitle) ||
    (prev.speaker === QUEST_VISUAL_SPEAKER && Boolean(prev.visualBeat))
  );
}

export type AppendDialogueOpts = {
  /** Set while advancing `activeQuestId` so Play can hide this block once the quest completes. */
  sourceQuestId?: string;
};

export const appendDialogue = (
  speaker: string,
  text: string,
  opts?: AppendDialogueOpts
): DialogueLogEntry => {
  const atMs = Date.now();
  return {
    id: `${speaker}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    speaker,
    text,
    atMs,
    ...(opts?.sourceQuestId !== undefined ? { sourceQuestId: opts.sourceQuestId } : {}),
  };
};

export function appendQuestVisualBeat(beat: QuestVisualBeat, opts?: AppendDialogueOpts): DialogueLogEntry {
  const atMs = Date.now();
  return {
    id: `${QUEST_VISUAL_SPEAKER}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    speaker: QUEST_VISUAL_SPEAKER,
    text: '',
    atMs,
    visualBeat: beat,
    ...(opts?.sourceQuestId !== undefined ? { sourceQuestId: opts.sourceQuestId } : {}),
  };
}

/** Attach `sourceQuestId` to lines authored elsewhere (e.g. class-lock templates). */
export function tagDialogueSourceQuest(
  entries: readonly DialogueLogEntry[],
  sourceQuestId: string
): DialogueLogEntry[] {
  return entries.map((e) => ({ ...e, sourceQuestId }));
}

/** Dialogue lines for art when entering `stepId` (explicit beats, else legacy shuffle portrait on start step only). */
export function visualDialogueEntriesForQuestStep(quest: QuestDefinition, stepId: string): DialogueLogEntry[] {
  const qOpts = { sourceQuestId: quest.id };
  const beats = quest.stepVisuals?.[stepId];
  if (beats !== undefined) {
    return beats.map((beat) => appendQuestVisualBeat(beat, qOpts));
  }
  if (stepId === quest.startStepId) {
    return [appendDialogue(QUEST_IMAGE_SPEAKER, quest.title, qOpts)];
  }
  return [];
}

/** Multi-line class lock block (matches daily report grouping). */
export function buildClassLockDialogueLines(displayClass: string): DialogueLogEntry[] {
  return [
    appendDialogue(DAY_REPORT_SPEAKER, CLASS_LOCK_REPORT_TITLE),
    appendDialogue(DAY_REPORT_SPEAKER, `Your path is set: ${displayClass}.`),
    appendDialogue(DAY_REPORT_SPEAKER, `From now on you walk as a ${displayClass}.`),
  ];
}

/** Multi-line Silver Lake race revelation block. */
export function buildRaceLockDialogueLines(
  playerName: string,
  raceDisplay: string,
  level: number,
  classDisplay: string
): DialogueLogEntry[] {
  const name = playerName.trim() || 'Stranger';
  return [
    appendDialogue(DAY_REPORT_SPEAKER, RACE_LOCK_REPORT_TITLE),
    appendDialogue(DAY_REPORT_SPEAKER, `${name}, the water finally names you.`),
    appendDialogue(
      DAY_REPORT_SPEAKER,
      `You return from the lake a Level ${level} ${raceDisplay} ${classDisplay}.`
    ),
  ];
}

export type DialogueVoice =
  | 'narrator'
  | 'dev'
  | 'player'
  | 'divider'
  | 'report'
  | 'quest_image'
  | 'quest_visual'
  | 'journal_recap';

export type DialogueVoiceBlockModel = {
  role: DialogueVoice;
  lines: DialogueLogEntry[];
};

export type ChronicleMergedRow =
  | {
      kind: 'dialogue';
      atMs: number;
      id: string;
      speaker: string;
      text: string;
      visualBeat?: QuestVisualBeat;
      sourceQuestId?: string;
    }
  | { kind: 'world'; atMs: number; text: string };

/** Merge dialogue + world rows by `atMs` (chronicle / play feed); tie-break: dialogue before world. */
export function mergeDialogueAndWorldRows(
  dialogueLines: readonly DialogueLogEntry[],
  worldEntries: readonly WorldEventLogEntry[]
): ChronicleMergedRow[] {
  const dialogueRows: ChronicleMergedRow[] = dialogueLines.map((line) => ({
    kind: 'dialogue' as const,
    atMs: line.atMs,
    id: line.id,
    speaker: line.speaker,
    text: line.text,
    visualBeat: line.visualBeat,
    ...(line.sourceQuestId !== undefined ? { sourceQuestId: line.sourceQuestId } : {}),
  }));
  const worldRows: ChronicleMergedRow[] = worldEntries.map((entry) => ({
    kind: 'world' as const,
    atMs: entry.atMs,
    text: entry.text,
  }));
  return [...dialogueRows, ...worldRows].sort((a, b) => {
    if (a.atMs !== b.atMs) return a.atMs - b.atMs;
    if (a.kind === b.kind) return 0;
    return a.kind === 'dialogue' ? -1 : 1;
  });
}

/** Play tab only: full dialogue + world + path recap lines (Chronicle uses `mergeDialogueAndWorldRows` without journal). */
export function mergePlayFeedRows(
  dialogueLines: readonly DialogueLogEntry[],
  worldEntries: readonly WorldEventLogEntry[],
  journalEntries: readonly JournalLogEntry[]
): ChronicleMergedRow[] {
  const dialogueRows: ChronicleMergedRow[] = dialogueLines.map((line) => ({
    kind: 'dialogue' as const,
    atMs: line.atMs,
    id: line.id,
    speaker: line.speaker,
    text: line.text,
    visualBeat: line.visualBeat,
    ...(line.sourceQuestId !== undefined ? { sourceQuestId: line.sourceQuestId } : {}),
  }));
  const journalRows: ChronicleMergedRow[] = journalEntries.map((j) => ({
    kind: 'dialogue' as const,
    atMs: j.atMs,
    id: j.id,
    speaker: JOURNAL_RECAP_SPEAKER,
    text: j.text,
  }));
  const worldRows: ChronicleMergedRow[] = worldEntries.map((entry) => ({
    kind: 'world' as const,
    atMs: entry.atMs,
    text: entry.text,
  }));

  const rank = (row: ChronicleMergedRow): number => {
    if (row.kind === 'world') return 2;
    if (row.kind === 'dialogue' && row.speaker === JOURNAL_RECAP_SPEAKER) return 1;
    return 0;
  };

  return [...dialogueRows, ...journalRows, ...worldRows].sort((a, b) => {
    if (a.atMs !== b.atMs) return a.atMs - b.atMs;
    return rank(a) - rank(b);
  });
}

export type ChronicleSegment =
  | { type: 'world'; row: Extract<ChronicleMergedRow, { kind: 'world' }> }
  | { type: 'dialogueBlock'; role: DialogueVoice; lines: DialogueLogEntry[] };

export const dialogueVoiceRole = (speaker: string): DialogueVoice => {
  if (speaker === 'Narrator') return 'narrator';
  if (speaker === 'Dev Message') return 'dev';
  if (speaker === QUEST_DIVIDER_SPEAKER) return 'divider';
  if (speaker === QUEST_IMAGE_SPEAKER) return 'quest_image';
  if (speaker === QUEST_VISUAL_SPEAKER) return 'quest_visual';
  if (speaker === JOURNAL_RECAP_SPEAKER) return 'journal_recap';
  if (speaker === DAY_REPORT_SPEAKER) return 'report';
  return 'player';
};

const isDayReportTitle = (text: string): boolean => /^Day\s+\d+\s+Report$/i.test(text.trim());

/** Starts a new `report` voice block (day rollups + milestone infographics). */
export const isReportInfographicTitle = (text: string): boolean => {
  const t = text.trim();
  return (
    isDayReportTitle(text) ||
    t === CLASS_LOCK_REPORT_TITLE ||
    t === RACE_LOCK_REPORT_TITLE
  );
};

export const groupDialogueLinesByVoice = (lines: DialogueLogEntry[]): DialogueVoiceBlockModel[] => {
  if (lines.length === 0) return [];
  const blocks: DialogueVoiceBlockModel[] = [];
  for (const line of lines) {
    const role = dialogueVoiceRole(line.speaker);
    const last = blocks[blocks.length - 1];
    const startNewReport = role === 'report' && isReportInfographicTitle(line.text);
    if (last && last.role === role && !startNewReport) {
      last.lines.push(line);
    } else {
      blocks.push({ role, lines: [line] });
    }
  }
  return blocks;
};

export const groupChronicleRows = (sortedRows: ChronicleMergedRow[]): ChronicleSegment[] => {
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
      if (role === 'report' && lines.length > 0 && isReportInfographicTitle(d.text)) break;
      lines.push({
        id: d.id,
        speaker: d.speaker,
        text: d.text,
        atMs: d.atMs,
        visualBeat: d.visualBeat,
        ...(d.sourceQuestId !== undefined ? { sourceQuestId: d.sourceQuestId } : {}),
      });
      i += 1;
    }
    out.push({ type: 'dialogueBlock', role, lines });
  }
  return out;
};

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

export const imperativePhraseToThirdPerson = (phrase: string): string => {
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

export const formatPlayerChoiceDialogueLine = (playerName: string, label: string): string => {
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
