import type { DialogueLogEntry, QuestVisualBeat } from './quests/types';
import { publicAsset } from '@/lib/publicAsset';
import { getQuestImageSrcForTitle } from './rpgArtAssignments';
import type { DialogueVoice } from './dialogueFormat';
import { PLAYER_ACTION_SPEAKER } from './dialogueFormat';

function resolveQuestAssetUrl(src: string): string {
  const t = src.trim();
  if (/^https?:\/\//i.test(t) || t.startsWith('data:')) return t;
  if (t.startsWith('/')) return publicAsset(t.replace(/^\/+/, ''));
  const normalized = t.replace(/^\/+/, '');
  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return publicAsset(encoded);
}

const QUEST_IMG_ROW_SLOT =
  'min-h-0 max-h-[11rem] min-w-[28%] max-w-[34%] flex-1 rounded-md border border-[var(--candle-rule)] object-cover';

function QuestVisualBeatView({ beat }: { beat: QuestVisualBeat }) {
  if (beat.kind === 'image') {
    return (
      <div className="flex justify-center py-0.5">
        <img
          src={resolveQuestAssetUrl(beat.src)}
          alt={beat.alt ?? ''}
          className="mx-auto aspect-[3/4] w-full max-w-[200px] rounded-md border border-[var(--candle-rule)] object-cover"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="flex flex-row flex-wrap justify-center gap-2 py-1">
      {beat.images.map((img, idx) => (
        <img
          key={`${img.src}-${idx}`}
          src={resolveQuestAssetUrl(img.src)}
          alt={img.alt ?? ''}
          className={QUEST_IMG_ROW_SLOT}
          loading="lazy"
        />
      ))}
    </div>
  );
}

const DIALOGUE_NARRATOR_CLASSES =
  'font-serif text-[0.9375rem] leading-relaxed tracking-wide italic text-[var(--facsimile-narrator-ink)]';

/** Play tab: narration reads as steady body text (choices mirror player-line chrome below). */
const DIALOGUE_NARRATOR_PLAY_CLASSES =
  'font-serif text-[1rem] leading-relaxed tracking-normal not-italic text-[var(--candle-ink-soft)]';

const DIALOGUE_PLAYER_BODY_CLASSES =
  'font-serif text-sm font-medium leading-6 text-[var(--facsimile-player-ink)]';

/** Post-choice player line + quest choice buttons (Play) — keep in sync for fade continuity. */
export const PLAY_TAB_PLAYER_LINE_SHELL =
  'ml-auto w-[min(92%,22rem)] border-l border-[var(--candle-flame-soft)] pl-3 text-right';

export const PLAY_TAB_PLAYER_LINE_TEXT =
  'font-serif text-[0.9375rem] font-medium leading-relaxed text-[var(--candle-wax)]';

/** Same metrics as `PLAY_TAB_PLAYER_LINE_TEXT` with `!` so it wins over global `.choice-line`. */
export const PLAY_TAB_PLAYER_LINE_TEXT_CHOICE =
  '!font-serif !text-[0.9375rem] !font-medium !leading-relaxed !text-[var(--candle-wax)] !text-right';

/** Shared “UI / dev note” chrome (PlayTab hints, Dev Message dialogue). */
export const DIALOGUE_DEV_MESSAGE_CLASSES =
  'rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 font-mono text-[0.8125rem] not-italic leading-relaxed text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.10)]';

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
    presentation === 'play' ? PLAY_TAB_PLAYER_LINE_TEXT : DIALOGUE_PLAYER_BODY_CLASSES;

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

  if (role === 'report') {
    const [titleLine, ...bodyLines] = lines;
    const shellPlay =
      'rounded-lg border border-[var(--candle-rule)] bg-black/30 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(230,161,87,0.04)]';
    const shellChronicle =
      'rounded-lg border border-[var(--candle-rule)] bg-[rgba(0,0,0,0.28)] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(230,161,87,0.04)]';
    return (
      <div className="py-0.5">
        <div className={presentation === 'play' ? shellPlay : shellChronicle}>
          {titleLine ? (
            <p className="font-cormorant text-base font-medium tracking-[0.04em] text-[var(--candle-wax)]">
              {titleLine.text}
            </p>
          ) : null}
          {bodyLines.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
              {bodyLines.map((line) => (
                <li key={line.id}>{line.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    );
  }

  if (role === 'quest_visual') {
    return (
      <div className="space-y-3 py-0.5">
        {lines.map((line) =>
          line.visualBeat ? <QuestVisualBeatView key={line.id} beat={line.visualBeat} /> : null
        )}
      </div>
    );
  }

  if (role === 'quest_image') {
    const questTitle = lines[0]?.text ?? '';
    const imageSrc = getQuestImageSrcForTitle(questTitle);

    return (
      <div className="py-0.5">
        <img
          src={imageSrc}
          alt={questTitle ? `${questTitle} illustration` : 'Quest illustration'}
          className="mx-auto mb-2 aspect-[3/4] w-full max-w-[200px] rounded-md border border-[var(--candle-rule)] object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (role === 'journal_recap') {
    const bodyClass =
      presentation === 'play'
        ? 'font-serif text-[1rem] leading-relaxed tracking-normal not-italic text-[var(--candle-ink-soft)]'
        : 'font-serif text-[0.9375rem] leading-relaxed text-[var(--candle-ink-soft)]';
    return (
      <div className="space-y-1 py-0.5">
        {lines.map((line) => (
          <p key={line.id} className={bodyClass}>
            {line.text}
          </p>
        ))}
      </div>
    );
  }

  const playerShellClass =
    presentation === 'play'
      ? PLAY_TAB_PLAYER_LINE_SHELL
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
