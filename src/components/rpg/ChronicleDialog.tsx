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
      <DialogContent className="max-h-[85vh] max-w-lg border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel)] text-[var(--facsimile-ink)]">
        <DialogHeader>
          <DialogTitle>Chronicle</DialogTitle>
          <DialogDescription className="text-[var(--facsimile-ink-muted)]">
            Dialogue and world events, oldest first.
          </DialogDescription>
        </DialogHeader>
        {isOpen ? (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {chronicleSegments.map((segment, index) => {
              if (segment.type === 'world') {
                const row = segment.row;
                return (
                  <div
                    key={`world-${row.atMs}-${index}-${row.text.slice(0, 24)}`}
                    className="border-b border-[var(--facsimile-panel-border)]/60 pb-3 last:border-b-0"
                  >
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--facsimile-ink-muted)]">
                      {chronicleDateTimeFmt.format(row.atMs)}
                    </p>
                    <p className="text-sm text-[var(--facsimile-ink-muted)]">{row.text}</p>
                  </div>
                );
              }
              const first = segment.lines[0];
              return (
                <div
                  key={`dlg-${segment.role}-${first?.id ?? index}`}
                  className="border-b border-[var(--facsimile-panel-border)]/60 pb-3 last:border-b-0"
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--facsimile-ink-muted)]">
                    {chronicleDateTimeFmt.format(first.atMs)}
                  </p>
                  <DialogueVoiceBlock role={segment.role} lines={segment.lines} />
                </div>
              );
            })}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
