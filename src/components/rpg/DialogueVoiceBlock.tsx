import { publicAsset } from '@/lib/publicAsset';
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
  'rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 font-mono text-[12px] not-italic leading-relaxed text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.10)]';

const QUEST_IMAGE_SOURCES: Record<string, string> = {
  'The Forest Awakening': publicAsset('quest-images/horse.jpg'),
  'Boar in the Brush': publicAsset('quest-images/lakeside.jpg'),
  'Silver Lake': publicAsset('quest-images/night.jpg'),
  'Abandoned Shelter': publicAsset('quest-images/sunset.jpg'),
  'Airship?!': publicAsset('quest-images/horse.jpg'),
  'Wandering Skeleton': publicAsset('quest-images/lakeside.jpg'),
  'The Green Hand': publicAsset('quest-images/night.jpg'),
  'Wolf Attack': publicAsset('quest-images/sunset.jpg'),
  'The Waterfall': publicAsset('quest-images/horse.jpg'),
  'Find an Earring': publicAsset('quest-images/lakeside.jpg'),
  'Find a Bracelet': publicAsset('quest-images/night.jpg'),
  'Find a Shoe': publicAsset('quest-images/sunset.jpg'),
  'Find a Hat': publicAsset('quest-images/horse.jpg'),
  'Mushroom Patch': publicAsset('quest-images/lakeside.jpg'),
  'Fever Dream': publicAsset('quest-images/night.jpg'),
  'Sweet Dream': publicAsset('quest-images/sunset.jpg'),
};

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

  if (role === 'quest_image') {
    const questTitle = lines[0]?.text ?? '';
    const imageSrc = QUEST_IMAGE_SOURCES[questTitle];

    return (
      <div className="py-0.5">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${questTitle} illustration`}
            className="mx-auto mb-2 aspect-[3/4] w-full max-w-[200px] rounded-md border border-[var(--candle-rule)] object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="mx-auto mb-2 flex aspect-[3/4] w-full max-w-[200px] items-center justify-center rounded-md border border-dashed border-[var(--candle-rule)] bg-black/40 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--candle-ink-faint)]"
            aria-label="Quest illustration placeholder"
          >
            Image 200 x 266
          </div>
        )}
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
