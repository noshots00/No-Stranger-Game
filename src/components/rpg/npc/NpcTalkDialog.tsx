import type { RefObject, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import { NpcTalkScrollPanes } from '@/components/rpg/npc/NpcTalkScrollPanes';

type NpcTalkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  portraitSrc: string;
  portraitAlt: string;
  npcSpeakerLabel: string;
  logAriaLabel: string;
  transcript: TranscriptEntry[];
  logEndRef: RefObject<HTMLDivElement | null>;
  /** Optional slot beside portrait (e.g. Merchant Talk/Shop tabs). Omit for talk-only NPCs. */
  portraitAside?: ReactNode;
  choicePane: ReactNode;
};

/**
 * Full-screen NPC conversation shell (same fixed 95dvh layout as Merchant Talk).
 */
export function NpcTalkDialog({
  open,
  onOpenChange,
  title,
  portraitSrc,
  portraitAlt,
  npcSpeakerLabel,
  logAriaLabel,
  transcript,
  logEndRef,
  portraitAside,
  choicePane,
}: NpcTalkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'z-[55] flex !flex-col gap-0 overflow-hidden border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
          'h-[95dvh] max-h-[95dvh] min-h-0 w-[min(95vw,430px)] max-w-none sm:rounded-lg',
          'data-[state=open]:slide-in-from-bottom-2'
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1 px-10 text-center sm:text-center">
          <DialogTitle className="font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {portraitAside ? (
            <div className="flex w-full shrink-0 flex-row items-center justify-center gap-6 px-1">
              <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
                <img
                  src={portraitSrc}
                  alt={portraitAlt}
                  className="aspect-[3/4] w-[min(120px,32vw)] rounded-md border border-[var(--candle-rule)] object-cover shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-center justify-center">{portraitAside}</div>
            </div>
          ) : (
            <div className="flex w-full shrink-0 justify-center px-1">
              <img
                src={portraitSrc}
                alt={portraitAlt}
                className="aspect-[3/4] w-[min(120px,32vw)] rounded-md border border-[var(--candle-rule)] object-cover shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
              />
            </div>
          )}

          <NpcTalkScrollPanes
            transcript={transcript}
            logEndRef={logEndRef}
            npcSpeakerLabel={npcSpeakerLabel}
            logAriaLabel={logAriaLabel}
          >
            {choicePane}
          </NpcTalkScrollPanes>
        </div>
      </DialogContent>
    </Dialog>
  );
}
