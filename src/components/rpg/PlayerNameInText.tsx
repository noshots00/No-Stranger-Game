import { Fragment, useMemo } from 'react';

type TextSegment = { kind: 'text'; value: string } | { kind: 'name'; value: string };

function isNameBoundary(char: string | undefined): boolean {
  if (char === undefined || char.length === 0) return true;
  return /[\s.,!?;:—\-"'()[\]{}]/.test(char);
}

/** Split `text` into plain spans and player-name spans (boundary-safe exact match). */
export function splitTextByPlayerName(text: string, playerName: string): TextSegment[] {
  const name = playerName.trim();
  if (name.length === 0) return [{ kind: 'text', value: text }];

  const segments: TextSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const found = text.indexOf(name, cursor);
    if (found === -1) {
      segments.push({ kind: 'text', value: text.slice(cursor) });
      break;
    }
    const before = found === 0 ? undefined : text[found - 1];
    const after = found + name.length >= text.length ? undefined : text[found + name.length];
    if (!isNameBoundary(before) || !isNameBoundary(after)) {
      cursor = found + 1;
      continue;
    }
    if (found > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, found) });
    }
    segments.push({ kind: 'name', value: name });
    cursor = found + name.length;
  }

  if (segments.length === 0) return [{ kind: 'text', value: text }];
  return segments;
}

type PlayerNameInTextProps = {
  text: string;
  playerName: string;
  className?: string;
};

/** Wrap logged-in player name occurrences in `.player-name-mark`. */
export function PlayerNameInText({ text, playerName, className }: PlayerNameInTextProps) {
  const segments = useMemo(() => splitTextByPlayerName(text, playerName), [text, playerName]);

  return (
    <span className={className}>
      {segments.map((segment, idx) =>
        segment.kind === 'name' ? (
          <span key={`name-${idx}`} className="player-name-mark">
            {segment.value}
          </span>
        ) : (
          <Fragment key={`text-${idx}`}>{segment.value}</Fragment>
        )
      )}
    </span>
  );
}

/** Inline player name highlight (no surrounding prose). */
export function PlayerNameMark({ name }: { name: string }) {
  const display = name.trim() || 'Stranger';
  return <span className="player-name-mark">{display}</span>;
}
