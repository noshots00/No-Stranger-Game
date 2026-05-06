import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type DetailsProps = ComponentPropsWithoutRef<'details'> & { defaultOpen?: boolean };

/** Summary line stack (kicker + title) for ledger rows. */
export function PlayLedgerKicker({
  label,
  title,
  mutedTitle,
}: {
  label: string;
  title: string;
  mutedTitle?: boolean;
}) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">{label}</span>
      <span
        className={`text-sm text-[var(--candle-ink-soft)] ${mutedTitle ? 'line-through opacity-70' : ''}`}
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
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  /** Initial expanded state only (native `<details>`). */
  defaultOpen?: boolean;
}) {
  const props: DetailsProps = {
    className:
      'group border-b border-[var(--candle-rule)]/60 py-2 font-serif text-[var(--candle-ink-soft)]',
    ...(defaultOpen ? { defaultOpen: true } : {}),
  };

  return (
    <details {...props}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1 text-left">{summary}</div>
        <span
          className="mt-0.5 shrink-0 text-[0.65rem] leading-none text-[var(--candle-ink-faint)] transition-transform group-open:rotate-180"
          aria-hidden
        >
          ▾
        </span>
      </summary>
      <div className="mt-2 space-y-3 border-l border-[var(--candle-rule)]/35 pl-3">{children}</div>
    </details>
  );
}
