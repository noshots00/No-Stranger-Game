import type { DialogueLogEntry, QuestVisualBeat } from './quests/types';
import { publicAsset } from '@/lib/publicAsset';
import { getQuestImageSrcForTitle } from './rpgArtAssignments';
import { questVisualImageClassName } from './questVisualImage';
import type { DialogueVoice } from './dialogueFormat';
import { PLAYER_ACTION_SPEAKER } from './dialogueFormat';
import { isReportInfographicTitle } from './dialogueFormat';
import {
  RPG_UI_BODY,
  RPG_UI_EMPHASIS,
  RPG_UI_LOG_LINE,
  RPG_UI_PROMPT,
} from './typography/rpgUiTypography';
import { DayReportLineText } from './items/DayReportLineText';

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
          className={questVisualImageClassName(beat.fit ?? 'cover', 'inline')}
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
  'whitespace-pre-line font-serif text-[0.9375rem] leading-relaxed tracking-wide italic text-[var(--facsimile-narrator-ink)]';

const DIALOGUE_NARRATOR_PROMPT_CHRONICLE_CLASSES =
  'whitespace-pre-line rounded-r-md border-l-[3px] border-[var(--candle-flame)]/55 bg-black/38 py-2.5 pl-3 pr-2 font-cormorant text-[1.0625rem] font-semibold leading-snug tracking-wide text-[var(--candle-ink)] shadow-[inset_1px_0_0_rgba(230,161,87,0.18),0_1px_10px_rgba(0,0,0,0.35)]';

const DIALOGUE_PLAYER_BODY_CLASSES =
  'font-serif text-sm font-medium leading-6 text-[var(--facsimile-player-ink)]';

/** Post-choice player line (Play feed) — full-width log, not chat rail. */
export const PLAY_TAB_PLAYER_LINE_SHELL = 'w-full py-0.5 text-left';

/** Quest choice rail — legacy inline quest; full width on Play. */
export const PLAY_TAB_QUEST_CHOICE_SHELL = 'w-full text-center';

export const PLAY_TAB_PLAYER_LINE_TEXT =
  'rpg-font-ui text-[17px] font-medium leading-snug tracking-[0.01em] text-[var(--candle-wax)]';

/** Shared “UI / dev note” chrome (PlayTab hints, Dev Message dialogue). */
export const DIALOGUE_DEV_MESSAGE_CLASSES =
  'rounded-lg border border-amber-500/25 bg-amber-950/40 px-3 py-2 font-mono text-[0.8125rem] not-italic leading-relaxed text-amber-100/85';

export function DialogueVoiceBlock({
  role,
  lines,
  presentation = 'chronicle',
}: {
  role: DialogueVoice;
  lines: DialogueLogEntry[];
  presentation?: 'play' | 'chronicle';
}) {
  const narratorClasses = presentation === 'play' ? RPG_UI_LOG_LINE : DIALOGUE_NARRATOR_CLASSES;
  const narratorPromptClasses =
    presentation === 'play' ? RPG_UI_PROMPT : DIALOGUE_NARRATOR_PROMPT_CHRONICLE_CLASSES;
  const playerBodyClasses =
    presentation === 'play' ? PLAY_TAB_PLAYER_LINE_TEXT : DIALOGUE_PLAYER_BODY_CLASSES;

  if (role === 'narrator_prompt') {
    return (
      <div className="py-0.5">
        <div className={presentation === 'play' ? 'rpg-panel rounded-sm px-2 py-1.5' : 'space-y-1.5'}>
          {lines.map((line) => (
            <p key={line.id} className={narratorPromptClasses}>
              {line.text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (role === 'narrator') {
    return (
      <div className="py-0.5">
        <div className="space-y-1">
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
    const hasStyledTitle = Boolean(titleLine && isReportInfographicTitle(titleLine.text));
    const reportBodyLines = hasStyledTitle ? bodyLines : lines;
    const shellPlay = 'rpg-panel rounded-sm px-2 py-1';
    const shellChronicle =
      'rounded-lg border border-[var(--candle-rule)] bg-[rgba(0,0,0,0.28)] px-4 py-[5px] shadow-[inset_0_0_0_1px_rgba(230,161,87,0.04)]';
    return (
      <div className="py-0">
        <div className={presentation === 'play' ? shellPlay : shellChronicle}>
          {hasStyledTitle && titleLine ? (
            <p className={`${RPG_UI_EMPHASIS} text-[var(--candle-wax)]`}>{titleLine.text}</p>
          ) : null}
          {reportBodyLines.length > 0 ? (
            <ul
              className={`mt-0.5 list-disc space-y-0 pl-4 ${presentation === 'play' ? RPG_UI_BODY : 'font-serif text-xs leading-snug text-[var(--candle-ink-soft)]'}`}
            >
              {reportBodyLines.map((line) => (
                <li key={line.id}>
                  <DayReportLineText text={line.text} />
                </li>
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
    const bodyClass = presentation === 'play' ? RPG_UI_LOG_LINE : DIALOGUE_NARRATOR_CLASSES;
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
      <div className="space-y-1">
        {lines.map((line) => (
          <div key={line.id}>
            {line.speaker === PLAYER_ACTION_SPEAKER || line.speaker === 'You' ? (
              <p className={playerBodyClasses}>{line.text}</p>
            ) : (
              <p className={playerBodyClasses}>
                <span className="font-medium text-[var(--candle-flame-soft)]">{line.speaker}: </span>
                {line.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
