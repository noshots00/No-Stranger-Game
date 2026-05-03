import { UI_VERSION_LABEL } from './constants';

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
};

export function GameHeader({ dayCounter, currentLocation, locationIndicatorClass }: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full select-none backdrop-blur-[6px]" role="status" aria-label="Game status">
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--candle-rule)] bg-black/40 px-1.5 py-px font-serif text-[var(--candle-ink)] backdrop-blur-sm">
        <div className="flex min-w-0 flex-col gap-0 leading-none">
          <p className="font-serif text-[0.5625rem] font-medium tracking-[0.02em] text-[var(--candle-ink)]">
            Day {dayCounter}
          </p>
          <p className="truncate font-serif text-[0.5rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
            {UI_VERSION_LABEL}
          </p>
        </div>
        <p
          className={`shrink-0 max-w-[45%] truncate text-right font-serif text-[0.5625rem] uppercase leading-tight tracking-[0.14em] ${locationIndicatorClass}`}
        >
          {currentLocation}
        </p>
      </div>
    </header>
  );
}
