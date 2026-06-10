type DevTimeToolsPanelProps = {
  dayCounter: number;
  onAdvanceDay: () => void;
  compact?: boolean;
};

/** Virtual clock and day-roll dev controls. */
export function DevTimeToolsPanel({ dayCounter, onAdvanceDay, compact = false }: DevTimeToolsPanelProps) {
  return (
    <div className={`flex flex-col font-serif text-xs text-[var(--candle-ink)] ${compact ? 'gap-1' : 'gap-2'}`}>
      {!compact ? (
        <p className="font-serif text-[0.65rem] uppercase tracking-[0.16em] text-[var(--candle-wax)]">Time</p>
      ) : null}
      <p className="text-[0.65rem] text-[var(--candle-ink-faint)]">Day {dayCounter}</p>
      <button
        type="button"
        className="w-full rounded border border-[var(--candle-wax)]/40 bg-[var(--candle-flame)]/20 px-1.5 py-1 text-[0.65rem] font-medium text-[var(--candle-ink)] hover:bg-[var(--candle-flame)]/30"
        onClick={onAdvanceDay}
      >
        +24h
      </button>
    </div>
  );
}
