import type { ReactNode } from 'react';

/** Summary line stack (kicker + title) for ledger rows. */
export function PlayLedgerKicker({
  label,
  title,
  mutedTitle,
  titleClassName,
}: {
  label?: string;
  title: string;
  mutedTitle?: boolean;
  titleClassName?: string;
}) {
  return (
    <span className="flex flex-col gap-0.5">
      {label ? (
        <span className="text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">{label}</span>
      ) : null}
      <span
        className={`text-sm text-[var(--candle-ink-soft)] ${mutedTitle ? 'line-through opacity-70' : ''} ${titleClassName ?? ''}`}
      >
        {title}
      </span>
    </span>
  );
}

/** Unified collapsible row for Play journal lines and quest rows (native disclosure). */
export function PlayLedgerDisclosure({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[var(--candle-rule)]/60 py-2 font-serif text-[var(--candle-ink-soft)]">
      <div className="min-w-0 text-left">{summary}</div>
      <div className="mt-2 space-y-3 border-l border-[var(--candle-rule)]/35 pl-3">{children}</div>
    </div>
  );
}
