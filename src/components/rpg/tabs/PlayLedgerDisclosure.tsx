import { useState, type ReactNode } from 'react';

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
  collapsible = false,
  defaultOpen = false,
  showDivider = true,
}: {
  summary: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  showDivider?: boolean;
}) {
  const dividerClass = showDivider ? 'border-b border-[var(--candle-rule)]/60' : '';

  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <div className={`group py-2 font-serif text-[var(--candle-ink-soft)] ${dividerClass}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0 flex-1 text-left">{summary}</div>
          <span
            className={`mt-0.5 shrink-0 text-[0.65rem] leading-none text-[var(--candle-ink-faint)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          >
            ▾
          </span>
        </button>
        {isOpen ? <div className="mt-2 space-y-3 border-l border-[var(--candle-rule)]/35 pl-3">{children}</div> : null}
      </div>
    );
  }

  return (
    <div className={`py-2 font-serif text-[var(--candle-ink-soft)] ${dividerClass}`}>
      <div className="min-w-0 text-left">{summary}</div>
      <div className="mt-2 space-y-3 border-l border-[var(--candle-rule)]/35 pl-3">{children}</div>
    </div>
  );
}
