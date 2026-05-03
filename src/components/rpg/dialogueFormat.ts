import type { DialogueLogEntry } from './quests/types';

export const PLAYER_ACTION_SPEAKER = 'PlayerAction';
export const QUEST_DIVIDER_SPEAKER = 'QuestDivider';
export const QUEST_IMAGE_SPEAKER = 'QuestImage';
/** Speaker id for end-of-day summary blocks (grouped as `report` voice). */
export const DAY_REPORT_SPEAKER = 'Day Report';

/** Report-block titles (same voice as daily report) for milestone infographics. */
export const CLASS_LOCK_REPORT_TITLE = 'Path secured';
export const RACE_LOCK_REPORT_TITLE = 'The lake answers';

export const appendDialogue = (speaker: string, text: string): DialogueLogEntry => {
  const atMs = Date.now();
  return {
    id: `${speaker}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    speaker,
    text,
    atMs,
  };
};

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

export type DialogueVoice = 'narrator' | 'dev' | 'player' | 'divider' | 'report' | 'quest_image';

export type DialogueVoiceBlockModel = {
  role: DialogueVoice;
  lines: DialogueLogEntry[];
};

export type ChronicleMergedRow =
  | { kind: 'dialogue'; atMs: number; id: string; speaker: string; text: string }
  | { kind: 'world'; atMs: number; text: string };

export type ChronicleSegment =
  | { type: 'world'; row: Extract<ChronicleMergedRow, { kind: 'world' }> }
  | { type: 'dialogueBlock'; role: DialogueVoice; lines: DialogueLogEntry[] };

export const dialogueVoiceRole = (speaker: string): DialogueVoice => {
  if (speaker === 'Narrator') return 'narrator';
  if (speaker === 'Dev Message') return 'dev';
  if (speaker === QUEST_DIVIDER_SPEAKER) return 'divider';
  if (speaker === QUEST_IMAGE_SPEAKER) return 'quest_image';
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
