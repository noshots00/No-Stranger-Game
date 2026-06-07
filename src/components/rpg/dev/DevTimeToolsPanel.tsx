type DevTimeToolsPanelProps = {
  dayCounter: number;
  onAdvanceDay: () => void;
  devFiveMinuteDays: boolean;
  onDevFiveMinuteDaysChange: (enabled: boolean) => void;
  rapidDaySimulation: boolean;
  onRapidDaySimulationChange: (enabled: boolean) => void;
};

const checkboxClass =
  'flex w-full cursor-pointer items-start gap-2 rounded border border-[var(--candle-rule)]/60 bg-black/25 px-2 py-1.5 text-left font-serif text-[0.7rem] leading-snug text-[var(--candle-ink-soft)] hover:bg-black/40';

/** Desktop right gutter: virtual clock and day-roll dev controls. */
export function DevTimeToolsPanel({
  dayCounter,
  onAdvanceDay,
  devFiveMinuteDays,
  onDevFiveMinuteDaysChange,
  rapidDaySimulation,
  onRapidDaySimulationChange,
}: DevTimeToolsPanelProps) {
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
      <label className={checkboxClass}>
        <input
          type="checkbox"
          className="mt-0.5"
          checked={devFiveMinuteDays}
          onChange={(e) => onDevFiveMinuteDaysChange(e.target.checked)}
        />
        <span>
          Set reset to every 5 minutes
          <span className="mt-0.5 block text-[0.6rem] text-[var(--candle-ink-faint)]">
            Eastern calendar days tick every five minutes instead of at midnight.
          </span>
        </span>
      </label>
      <label className={checkboxClass}>
        <input
          type="checkbox"
          className="mt-0.5"
          checked={rapidDaySimulation}
          onChange={(e) => onRapidDaySimulationChange(e.target.checked)}
        />
        <span>
          Simulate 24 hours every 2 seconds
          <span className="mt-0.5 block text-[0.6rem] text-[var(--candle-ink-faint)]">
            Auto-advances virtual time; pair with day rolls via Advance or village pacing.
          </span>
        </span>
      </label>
    </div>
  );
}
