import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type HeaderFlyoutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end' | 'center';
  /** Panel opens above or below the trigger. */
  side?: 'top' | 'bottom';
  panelClassName?: string;
  ariaLabel: string;
};

/** Lightweight header menu — avoids Radix dropdown focus traps that crash in the game shell. */
export function HeaderFlyout({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'end',
  side = 'bottom',
  panelClassName,
  ariaLabel,
}: HeaderFlyoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={rootRef}
      className={cn('relative min-w-0', align === 'end' && 'ml-auto', align === 'center' && 'mx-auto')}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        aria-label={ariaLabel}
        className={cn(
          'min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0 rounded-sm',
          align === 'end' && 'flex justify-end'
        )}
        onClick={() => onOpenChange(!open)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenChange(!open);
          }
        }}
      >
        {trigger}
      </div>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={ariaLabel}
          className={cn(
            'absolute z-[60] min-w-[10rem] rounded-md border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-1 text-[var(--candle-ink)] shadow-md',
            side === 'bottom' && 'top-[calc(100%+4px)]',
            side === 'top' && 'bottom-[calc(100%+4px)]',
            align === 'end' && 'right-0',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            panelClassName
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
