import { cn } from '@/lib/utils';
import type { QuestDefinition } from '../quests/types';
import { getQuestCardImageSrc } from '../rpgArtAssignments';
import { RPG_VILLAGE_HUB_STRIP } from '../typography/rpgUiTypography';

type CompletedQuestStripProps = {
  quest: QuestDefinition;
  playerFlags?: readonly string[];
  className?: string;
};

export function CompletedQuestStrip({ quest, playerFlags, className }: CompletedQuestStripProps) {
  const artSrc = getQuestCardImageSrc(quest, playerFlags);

  return (
    <div
      className={cn(
        'village-location-cloud-panel active-state-strip relative isolate min-h-[4.75rem] font-sans select-none',
        RPG_VILLAGE_HUB_STRIP,
        'h-auto',
        className
      )}
      aria-label={`Completed: ${quest.title}`}
    >
      <img src={artSrc} alt="" className="village-location-cloud-panel__art" />
      <div className="absolute inset-0 z-[2] flex items-center gap-2.5 px-2.5 py-1.5">
        <img
          src={artSrc}
          alt=""
          className="h-[3.25rem] w-[3.25rem] shrink-0 rounded-sm object-cover shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
          loading="lazy"
          aria-hidden
        />
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-[var(--candle-flame-soft)]">
          Completed: {quest.title}
        </p>
      </div>
    </div>
  );
}
