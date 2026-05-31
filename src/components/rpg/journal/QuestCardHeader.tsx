import { cn } from '@/lib/utils';
import type { QuestDefinition } from '../quests/types';
import { getQuestCardImageSrc } from '../rpgArtAssignments';
import { RPG_UI_CAPTION, RPG_UI_DISPLAY, RPG_UI_EMPHASIS } from '../typography/rpgUiTypography';

type QuestCardHeaderProps = {
  quest: QuestDefinition;
  title: string;
  briefingText: string;
  isNew: boolean;
  interactive: boolean;
  onOpen?: () => void;
};

export function QuestCardHeader({
  quest,
  title,
  briefingText,
  isNew,
  interactive,
  onOpen,
}: QuestCardHeaderProps) {
  const cardSrc = getQuestCardImageSrc(quest);
  const imageOnRight = quest.questCardImageSide === 'right';
  const newBadgeOnImage = cn(
    'absolute top-0 z-10 border border-[var(--candle-flame-soft)]/55 bg-[var(--candle-flame-soft)]/15 px-0.5 py-px font-sans text-[0.5rem] font-semibold uppercase leading-none tracking-[0.1em] text-[var(--candle-wax)]',
    imageOnRight ? 'left-0 rounded-br' : 'right-0 rounded-bl'
  );
  const titleOverlayHero = quest.questCardLayout === 'title-overlay-hero';
  const titleOverlayBlock = (
    <div
      className={cn(
        'flex flex-col items-center',
        titleOverlayHero && 'mx-auto w-full max-w-[260px]'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded border border-[var(--candle-rule)]',
          titleOverlayHero
            ? 'w-full shadow-[0_10px_32px_rgba(0,0,0,0.35)]'
            : 'w-[150px] shrink-0 shadow-[0_6px_20px_rgba(0,0,0,0.3)]'
        )}
      >
        <img
          src={cardSrc}
          alt={`${title} illustration`}
          className="aspect-[3/4] w-full object-cover"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent px-3 pb-10 pt-3">
          <p className={`text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${RPG_UI_DISPLAY}`}>
            {title}
          </p>
        </div>
        {isNew ? <span className={newBadgeOnImage}>New</span> : null}
      </div>
      <p className={`mt-2 w-full max-w-[260px] text-center ${RPG_UI_CAPTION}`}>{briefingText}</p>
    </div>
  );

  const image = (
    <div className="relative shrink-0">
      <img
        src={cardSrc}
        alt={`${title} illustration`}
        className="aspect-[3/4] w-[150px] rounded border border-[var(--candle-rule)] object-cover shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
        loading="lazy"
      />
      {isNew ? <span className={newBadgeOnImage}>New</span> : null}
    </div>
  );
  const titleAndBriefing = (
    <div className="flex min-h-0 w-[260px] min-w-0 flex-col justify-center gap-1 text-center">
      <p className={`${RPG_UI_EMPHASIS} text-[var(--candle-flame-soft)]`}>{title}</p>
      <p className={RPG_UI_CAPTION}>{briefingText}</p>
    </div>
  );
  const content =
    quest.questCardLayout === 'title-overlay' || quest.questCardLayout === 'title-overlay-hero' ? (
      titleOverlayBlock
    ) : (
      <div className="relative flex items-stretch justify-center gap-3">
        {imageOnRight ? (
          <>
            {titleAndBriefing}
            {image}
          </>
        ) : (
          <>
            {image}
            {titleAndBriefing}
          </>
        )}
      </div>
    );

  if (!interactive) {
    return <div className="w-full cursor-default py-0.5 font-sans select-none">{content}</div>;
  }

  return (
    <button type="button" onClick={onOpen} className="w-full py-0.5 font-sans hover:bg-black/15">
      {content}
    </button>
  );
}
