import { UI_VERSION_LABEL } from './constants';

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
  onAdvanceDay: () => void;
  onLogout: () => void;
  onResetStory: () => void;
};

export function GameHeader({
  dayCounter,
  currentLocation,
  locationIndicatorClass,
  onAdvanceDay,
  onLogout,
  onResetStory,
}: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-20 rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel)] px-2 py-1.5 backdrop-blur">
      <div className="relative flex items-center justify-between">
        <p className="mystery-muted text-[10px] uppercase tracking-[0.2em]">Day {dayCounter}</p>
        <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)]">
          {UI_VERSION_LABEL}
        </p>
        <p className={`${locationIndicatorClass} text-[10px] uppercase tracking-[0.2em]`}>{currentLocation}</p>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          onClick={onAdvanceDay}
          className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink)]"
        >
          24hr
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={onResetStory}
            className="text-[10px] uppercase tracking-[0.16em] text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]"
          >
            Reset Story
          </button>
        </div>
      </div>
    </header>
  );
}
