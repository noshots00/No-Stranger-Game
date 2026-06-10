import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DevCollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

/** Condensed dev rail block — collapsed by default. */
export function DevCollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
}: DevCollapsibleSectionProps) {
  return (
    <details
      className={cn(
        'group rounded border border-[var(--candle-rule)]/45 bg-black/30',
        className
      )}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="cursor-pointer list-none px-2 py-1 font-serif text-[0.58rem] uppercase tracking-[0.1em] text-[var(--candle-ink-soft)] marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-[var(--candle-ink-faint)] group-open:hidden">+</span>
        <span className="hidden text-[var(--candle-ink-faint)] group-open:inline">−</span>{' '}
        {title}
      </summary>
      <div className="space-y-1.5 border-t border-[var(--candle-rule)]/35 px-2 py-1.5">{children}</div>
    </details>
  );
}
