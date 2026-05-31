import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GamePanelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name when no visible title is rendered. */
  ariaLabel: string;
  children: ReactNode;
  panelClassName?: string;
};

/**
 * In-game overlay inside the portrait shell — no Radix Dialog / focus traps.
 */
export function GamePanelDialog({
  open,
  onOpenChange,
  ariaLabel,
  children,
  panelClassName,
}: GamePanelDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center p-1 sm:p-2"
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-black/80"
        aria-label="Close panel"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'relative z-[1] flex min-h-0 flex-col overflow-hidden border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 pt-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
          'h-[95dvh] max-h-[95dvh] w-full max-w-none rounded-lg font-serif text-[var(--candle-ink)]',
          panelClassName
        )}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-sm p-0.5 text-[var(--candle-ink-soft)] opacity-70 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)]"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-5" aria-hidden />
        </button>
        {children}
      </div>
    </div>
  );
}

export function GamePanelDialogTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        'shrink-0 text-center font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]',
        className
      )}
    >
      {children}
    </h2>
  );
}
