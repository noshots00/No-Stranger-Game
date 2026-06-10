import { Fragment, useMemo } from 'react';
import { listSpellDisplayNames } from '../combat/skillRegistry';
import { PlayerNameInText, type PlayerNameHighlightVariant } from '../PlayerNameInText';
import { SHIPPED_PLAYER_NAME_VARIANT } from '../characterHighlights';
import { SpellName } from './SpellName';

type TextSegment = { kind: 'text'; value: string } | { kind: 'spell'; value: string };

function isSpellNameBoundary(char: string | undefined): boolean {
  if (char === undefined || char.length === 0) return true;
  return /[\s.,!?;:—\-"'()[\]{}]/.test(char);
}

/** Split prose into plain spans and known spell display names (longest match first). */
export function splitTextBySpellNames(text: string, spellNames: readonly string[]): TextSegment[] {
  if (spellNames.length === 0) return [{ kind: 'text', value: text }];

  const ordered = [...spellNames].sort((a, b) => b.length - a.length);
  const segments: TextSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let matched: { name: string; index: number } | null = null;

    for (const name of ordered) {
      if (name.length === 0) continue;
      const found = text.indexOf(name, cursor);
      if (found === -1) continue;
      const before = found === 0 ? undefined : text[found - 1];
      const after = found + name.length >= text.length ? undefined : text[found + name.length];
      if (!isSpellNameBoundary(before) || !isSpellNameBoundary(after)) continue;
      if (!matched || found < matched.index || (found === matched.index && name.length > matched.name.length)) {
        matched = { name, index: found };
      }
    }

    if (!matched) {
      segments.push({ kind: 'text', value: text.slice(cursor) });
      break;
    }

    if (matched.index > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, matched.index) });
    }
    segments.push({ kind: 'spell', value: matched.name });
    cursor = matched.index + matched.name.length;
  }

  if (segments.length === 0) return [{ kind: 'text', value: text }];
  return segments;
}

type SpellNameInTextProps = {
  text: string;
  playerName?: string;
  className?: string;
  nameVariant?: PlayerNameHighlightVariant;
};

/** Highlight spell names in prose; plain spans still run through player-name highlighting. */
export function SpellNameInText({
  text,
  playerName = '',
  className,
  nameVariant = SHIPPED_PLAYER_NAME_VARIANT,
}: SpellNameInTextProps) {
  const spellNames = useMemo(() => listSpellDisplayNames(), []);
  const segments = useMemo(() => splitTextBySpellNames(text, spellNames), [text, spellNames]);

  return (
    <span className={className}>
      {segments.map((segment, idx) =>
        segment.kind === 'spell' ? (
          <SpellName key={`spell-${idx}-${segment.value}`} label={segment.value} />
        ) : (
          <PlayerNameInText
            key={`text-${idx}`}
            text={segment.value}
            playerName={playerName}
            nameVariant={nameVariant}
          />
        )
      )}
    </span>
  );
}
