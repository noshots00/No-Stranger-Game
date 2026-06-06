import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PanelUpdateButtonProps = {
  label: string;
  onClick: () => void;
  isFetching?: boolean;
  showLedgerHint?: boolean;
  className?: string;
};

export function PanelUpdateButton({
  label,
  onClick,
  isFetching = false,
  showLedgerHint = false,
  className,
}: PanelUpdateButtonProps) {
  return (
    <div className={cn('shrink-0 space-y-1.5', className)}>
      {showLedgerHint ? (
        <p className="font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
          Tap Update to load from the village ledger.
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full font-serif text-xs uppercase tracking-[0.1em]"
        disabled={isFetching}
        onClick={onClick}
      >
        {isFetching ? 'Updating…' : label}
      </Button>
    </div>
  );
}
