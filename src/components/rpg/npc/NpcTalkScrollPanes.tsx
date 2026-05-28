import type { RefObject, ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import { RPG_DIALOG_BODY } from '@/components/rpg/typography/rpgDialogTypography';

type NpcTalkScrollPanesProps = {
  transcript: TranscriptEntry[];
  logEndRef: RefObject<HTMLDivElement | null>;
  /** Shown before colon for NPC lines (Merchant, Carl, …). */
  npcSpeakerLabel: string;
  logAriaLabel: string;
  /** Floated above the choice scroller (e.g. dev step-back), not in scroll flow. */
  choiceOverlay?: ReactNode;
  children: ReactNode;
};

/**
 * Shared transcript + choice stacks for NPC dialogs (Merchant Talk, quest NPCs).
 */
export function NpcTalkScrollPanes({
  transcript,
  logEndRef,
  npcSpeakerLabel,
  logAriaLabel,
  choiceOverlay,
  children,
}: NpcTalkScrollPanesProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <ScrollArea className="min-h-0 max-h-[min(28dvh,11rem)] shrink-0 rounded-md border border-[var(--candle-rule)] bg-black/25 px-1">
        <div
          className={cn('space-y-2 px-3 py-1.5 pr-3', RPG_DIALOG_BODY)}
          role="log"
          aria-label={logAriaLabel}
        >
          {transcript.map((entry) => (
            <p
              key={entry.id}
              className={
                entry.role === 'narrator'
                  ? 'italic text-[var(--candle-ink-faint)]'
                  : entry.role === 'player'
                    ? 'text-[var(--candle-wax)]'
                    : 'text-[var(--candle-ink-soft)]'
              }
            >
              {entry.role === 'player' ? (
                <>
                  <span className="font-semibold text-[var(--candle-ink)]">You: </span>
                  {entry.text}
                </>
              ) : entry.role === 'narrator' ? (
                entry.text
              ) : (
                <>
                  <span className="font-semibold text-[var(--candle-flame-soft)]">{npcSpeakerLabel}: </span>
                  {entry.text}
                </>
              )}
            </p>
          ))}
          <div ref={logEndRef} className="h-px" aria-hidden />
        </div>
      </ScrollArea>

      <div className="relative min-h-0 min-h-[9rem] flex-1">
        {choiceOverlay}
        <ScrollArea className="npc-talk-choice-scroll h-full min-h-0 w-full rounded-md border border-[var(--candle-rule)] bg-black/20 px-1">
          <div
            className={cn(
              'flex w-full flex-col items-stretch justify-start gap-0 py-0.5 pr-2',
              choiceOverlay && 'pl-9'
            )}
          >
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
