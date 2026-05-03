import { UI_VERSION_LABEL } from './constants';

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
};

export function GameHeader({ dayCounter, currentLocation, locationIndicatorClass }: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full select-none backdrop-blur-[6px]" role="status" aria-label="Game status">
      <div className="grid min-w-0 grid-cols-3 items-center gap-1 rounded-md border border-[var(--candle-rule)] bg-black/40 px-1.5 py-px font-serif text-[var(--candle-ink)] backdrop-blur-sm">
        <p className="min-w-0 truncate text-left font-serif text-[0.5625rem] font-medium leading-none tracking-[0.02em] text-[var(--candle-ink)]">
          Day {dayCounter}
        </p>
        <p className="min-w-0 truncate text-center font-serif text-[0.5rem] uppercase leading-none tracking-[0.14em] text-[var(--candle-ink-faint)]">
          {UI_VERSION_LABEL}
        </p>
        <p
          className={`min-w-0 truncate text-right font-serif text-[0.5625rem] uppercase leading-none tracking-[0.14em] ${locationIndicatorClass}`}
        >
          {currentLocation}
        </p>
      </div>
    </header>
  );
}
