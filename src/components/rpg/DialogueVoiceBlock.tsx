import type { DialogueLogEntry } from './quests/types';
import type { DialogueVoice } from './dialogueFormat';
import { PLAYER_ACTION_SPEAKER } from './dialogueFormat';

const DIALOGUE_NARRATOR_CLASSES =
  'font-serif text-[0.9375rem] leading-relaxed tracking-wide italic text-[var(--facsimile-narrator-ink)]';

const DIALOGUE_NARRATOR_PLAY_CLASSES =
  'font-serif text-sm leading-relaxed tracking-wide italic text-[var(--candle-ink-soft)]';

const DIALOGUE_PLAYER_BODY_CLASSES =
  'font-serif text-sm font-medium leading-6 text-[var(--facsimile-player-ink)]';

const DIALOGUE_PLAYER_BODY_PLAY_CLASSES =
  'font-serif text-sm font-medium leading-relaxed text-[var(--candle-wax)]';

const DIALOGUE_DEV_MESSAGE_CLASSES =
  'rounded-lg border border-[var(--candle-rule)] bg-black/35 px-3 py-2 font-serif text-sm italic leading-relaxed text-[var(--candle-ink-soft)] shadow-[inset_0_0_0_1px_rgba(230,161,87,0.06)]';

export function DialogueVoiceBlock({
  role,
  lines,
  presentation = 'chronicle',
}: {
  role: DialogueVoice;
  lines: DialogueLogEntry[];
  presentation?: 'play' | 'chronicle';
}) {
  const narratorClasses =
    presentation === 'play' ? DIALOGUE_NARRATOR_PLAY_CLASSES : DIALOGUE_NARRATOR_CLASSES;
  const playerBodyClasses =
    presentation === 'play' ? DIALOGUE_PLAYER_BODY_PLAY_CLASSES : DIALOGUE_PLAYER_BODY_CLASSES;

  if (role === 'narrator') {
    return (
      <div className="py-0.5">
        <div className="space-y-1.5">
          {lines.map((line) => (
            <p key={line.id} className={narratorClasses}>
              {line.text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (role === 'dev') {
    return (
      <div className="space-y-1.5 py-0.5">
        {lines.map((line) => (
          <p key={line.id} className={DIALOGUE_DEV_MESSAGE_CLASSES}>
            {line.text}
          </p>
        ))}
      </div>
    );
  }

  if (role === 'divider') {
    return (
      <div className="py-1.5">
        <div className="mx-auto h-px w-[88%] bg-[var(--candle-rule)]" />
      </div>
    );
  }

  const playerShellClass =
    presentation === 'play'
      ? 'ml-auto w-[min(92%,22rem)] border-l border-[var(--candle-flame-soft)] pl-3 text-right'
      : 'ml-auto w-[min(92%,22rem)] rounded-lg border border-[var(--facsimile-player-ink)]/35 bg-[rgba(0,0,0,0.45)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

  return (
    <div className={playerShellClass}>
      <div className="space-y-1.5">
        {lines.map((line) => (
          <div key={line.id}>
            {line.speaker === PLAYER_ACTION_SPEAKER || line.speaker === 'You' ? (
              <p className={playerBodyClasses}>{line.text}</p>
            ) : (
              <p className={playerBodyClasses}>
                <span className="font-medium text-[var(--facsimile-player-label)]">{line.speaker}: </span>
                {line.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
