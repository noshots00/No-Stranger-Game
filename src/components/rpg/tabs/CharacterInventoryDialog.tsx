import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
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
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Inventory"
      panelClassName="h-auto max-h-[90dvh] w-full max-w-md gap-3 overflow-y-auto p-4 pt-8"
    >
      <GamePanelDialogTitle>Inventory</GamePanelDialogTitle>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--candle-ink-faint)]">Your pack is empty.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-[var(--candle-ink-soft)]">
            {entries.map((entry) => (
              <li
                key={entry.label}
                className="flex justify-between gap-3 border-b border-[var(--candle-rule)]/40 pb-1"
              >
                <span className="text-[var(--candle-ink)]">{entry.label}</span>
                <span className="font-mono tabular-nums text-[var(--candle-wax)]">×{entry.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GamePanelDialog>
  );
}
