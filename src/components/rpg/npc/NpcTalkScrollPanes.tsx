import type { RefObject, ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';

type NpcTalkScrollPanesProps = {
  transcript: TranscriptEntry[];
  logEndRef: RefObject<HTMLDivElement | null>;
  /** Shown before colon for NPC lines (Merchant, Carl, …). */
  npcSpeakerLabel: string;
  logAriaLabel: string;
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
  children,
}: NpcTalkScrollPanesProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <ScrollArea className="min-h-0 min-w-0 flex-[1.35] rounded-md border border-[var(--candle-rule)] bg-black/25 px-1">
        <div
          className="space-y-3 px-3 py-2 pr-4 font-serif text-sm leading-snug"
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

      <ScrollArea className="min-h-0 min-w-0 flex-1 rounded-md border border-[var(--candle-rule)] bg-black/20 px-1">
        <div className="flex flex-col gap-0.5 py-1 pr-4">{children}</div>
      </ScrollArea>
    </div>
  );
}
