import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryEntry } from '../helpers';

type CharacterInventoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: InventoryEntry[];
};

export function CharacterInventoryDialog({
  open,
  onOpenChange,
  entries,
}: CharacterInventoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,480px)] border-[var(--candle-rule)] bg-[var(--candle-hearth)] font-serif text-[var(--candle-ink)]">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-xl text-[var(--candle-wax)]">Inventory</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[min(60vh,360px)] pr-3">
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--candle-ink-faint)]">Your pack is empty.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-[var(--candle-ink-soft)]">
              {entries.map((entry) => (
                <li key={entry.label} className="flex justify-between gap-3 border-b border-[var(--candle-rule)]/40 pb-1">
                  <span className="text-[var(--candle-ink)]">{entry.label}</span>
                  <span className="font-mono tabular-nums text-[var(--candle-wax)]">×{entry.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
