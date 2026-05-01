import type { DialogueLogEntry } from './quests/types';
import type { DialogueVoice } from './dialogueFormat';
import { PLAYER_ACTION_SPEAKER } from './dialogueFormat';

const DIALOGUE_NARRATOR_CLASSES =
  'font-serif text-[0.9375rem] leading-relaxed tracking-wide italic text-[var(--facsimile-narrator-ink)]';

const DIALOGUE_NARRATOR_PLAY_CLASSES =
  'font-sans text-xs leading-relaxed tracking-wide text-[var(--facsimile-narrator-ink)]';

const DIALOGUE_PLAYER_BODY_CLASSES =
  'font-sans text-sm font-semibold leading-6 text-[var(--facsimile-player-ink)]';

const DIALOGUE_PLAYER_BODY_PLAY_CLASSES =
  'font-sans text-xs font-semibold leading-relaxed text-[var(--facsimile-player-ink)]';

const DIALOGUE_DEV_MESSAGE_CLASSES =
  'rounded-md border border-cyan-300/55 bg-cyan-950/35 px-2 py-1 text-sm leading-6 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]';

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
        <div className="mx-auto h-px w-[88%] bg-[var(--facsimile-panel-border)]/70" />
      </div>
    );
  }

  const playerShellClass =
    presentation === 'play'
      ? 'ml-auto w-[min(92%,22rem)] rounded-lg bg-[rgba(255,255,255,0.045)] px-3 py-2 ring-1 ring-[var(--facsimile-player-ink)]/15'
      : 'ml-auto w-[min(92%,22rem)] rounded-lg border border-[var(--facsimile-player-ink)]/40 bg-[rgba(0,0,0,0.45)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

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
