import type { CharacterUpdateKind, DialogueLogEntry } from './quests/types';
import { LevelGlintMark } from './LevelGlintMark';
import { PlayerNameInText, PlayerNameMark } from './PlayerNameInText';
import { RPG_UI_LOG_LINE } from './typography/rpgUiTypography';

const LEVEL_PHRASE_RE = /^You reached Level (\d+)!$/;
const LEGACY_LEVEL_PHRASE_RE = /^You reached level (\d+)\.$/;
const NAME_PHRASE_RE = /^Your name is (.+)\.$/;

function resolveCharacterUpdateKind(
  line: DialogueLogEntry,
  playerName: string
): CharacterUpdateKind | undefined {
  if (line.characterUpdateKind) return line.characterUpdateKind;
  if (LEVEL_PHRASE_RE.test(line.text) || LEGACY_LEVEL_PHRASE_RE.test(line.text)) {
    return 'character_level';
  }
  const name = playerName.trim() || 'Stranger';
  if (line.text === `Your name is ${name}.`) return 'player_name';
  return undefined;
}

type CharacterUpdateLineProps = {
  line: DialogueLogEntry;
  playerName: string;
  presentation?: 'play' | 'chronicle';
};

export function CharacterUpdateLine({ line, playerName, presentation = 'play' }: CharacterUpdateLineProps) {
  const bodyClass = presentation === 'play' ? RPG_UI_LOG_LINE : 'font-serif text-[0.9375rem] leading-relaxed text-[var(--facsimile-narrator-ink)]';
  const kind = resolveCharacterUpdateKind(line, playerName);

  if (kind === 'player_name') {
    const nameMatch = line.text.match(NAME_PHRASE_RE);
    const name = nameMatch?.[1]?.trim() || playerName.trim() || 'Stranger';
    return (
      <p className={bodyClass}>
        Your name is <PlayerNameMark name={name} />.
      </p>
    );
  }

  if (kind === 'character_level') {
    const levelMatch = line.text.match(LEVEL_PHRASE_RE) ?? line.text.match(LEGACY_LEVEL_PHRASE_RE);
    const level = levelMatch ? Number.parseInt(levelMatch[1], 10) : null;
    if (level !== null && Number.isFinite(level)) {
      return (
        <p className={bodyClass}>
          You reached <LevelGlintMark level={level} />
        </p>
      );
    }
  }

  return (
    <p className={bodyClass}>
      <PlayerNameInText text={line.text} playerName={playerName} />
    </p>
  );
}
