import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogueVoiceBlock } from './DialogueVoiceBlock';
import type { ChronicleSegment } from './dialogueFormat';

type ChronicleDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chronicleSegments: ChronicleSegment[];
  chronicleDateTimeFmt: Intl.DateTimeFormat;
};

export function ChronicleDialog({
  isOpen,
  onOpenChange,
  chronicleSegments,
  chronicleDateTimeFmt,
}: ChronicleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-6 font-serif text-[var(--candle-ink)] shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_0_60px_rgba(230,161,87,0.04)] sm:rounded-2xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="font-serif text-2xl font-medium tracking-[0.04em] text-[var(--candle-ink)]">
            Chronicle
          </DialogTitle>
          <DialogDescription className="font-serif text-sm italic text-[var(--candle-ink-soft)]">
            Dialogue and world events, oldest first.
          </DialogDescription>
        </DialogHeader>
        {isOpen ? (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {chronicleSegments.map((segment, index) => {
              if (segment.type === 'world') {
                const row = segment.row;
                return (
                  <div
                    key={`world-${row.atMs}-${index}-${row.text.slice(0, 24)}`}
                    className="border-b border-[var(--candle-rule)] pb-4 last:border-b-0"
                  >
                    <p className="font-serif text-[10px] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                      {chronicleDateTimeFmt.format(row.atMs)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--candle-ink-soft)]">{row.text}</p>
                  </div>
                );
              }
              const first = segment.lines[0];
              return (
                <div
                  key={`dlg-${segment.role}-${first?.id ?? index}`}
                  className="border-b border-[var(--candle-rule)] pb-4 last:border-b-0"
                >
                  <p className="font-serif text-[10px] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                    {chronicleDateTimeFmt.format(first.atMs)}
                  </p>
                  <div className="mt-1">
                    <DialogueVoiceBlock role={segment.role} lines={segment.lines} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
