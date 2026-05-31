import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Simple expand/collapse block (no Radix Collapsible). */
export function GamePanelExpandable({
  label,
  children,
  defaultOpen = false,
  className,
  triggerClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-md border border-[var(--candle-rule)]/80 bg-black/25', className)}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-serif text-sm text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]',
          triggerClassName
        )}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0 flex-1">{label}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-[var(--candle-rule)]/60 px-3 py-2">{children}</div>
      ) : null}
    </div>
  );
}
