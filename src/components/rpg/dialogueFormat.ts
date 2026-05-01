import type { DialogueLogEntry } from './quests/types';

export const PLAYER_ACTION_SPEAKER = 'PlayerAction';
export const QUEST_DIVIDER_SPEAKER = 'QuestDivider';

export type DialogueVoice = 'narrator' | 'dev' | 'player' | 'divider';

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
  return 'player';
};

export const groupDialogueLinesByVoice = (lines: DialogueLogEntry[]): DialogueVoiceBlockModel[] => {
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
