type DevTimeToolsPanelProps = {
  dayCounter: number;
  onAdvanceDay: () => void;
};

/** Desktop left gutter: virtual clock and day-roll dev controls. */
export function DevTimeToolsPanel({ dayCounter, onAdvanceDay }: DevTimeToolsPanelProps) {
  return (
    <div className="flex flex-col gap-2 font-serif text-xs text-[var(--candle-ink)]">
      <p className="font-serif text-[0.65rem] uppercase tracking-[0.16em] text-[var(--candle-wax)]">
        Time
      </p>
      <p className="text-[0.65rem] text-[var(--candle-ink-faint)]">
        Calendar day {dayCounter}
      </p>
      <button
        type="button"
        className="w-full rounded border border-[var(--candle-wax)]/40 bg-[var(--candle-flame)]/20 px-2 py-1.5 text-[0.7rem] font-medium text-[var(--candle-ink)] hover:bg-[var(--candle-flame)]/30"
        onClick={onAdvanceDay}
      >
        Advance 24 hours
      </button>
    </div>
  );
}
