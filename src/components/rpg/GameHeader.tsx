import { MoreHorizontal } from 'lucide-react';
import { UI_VERSION_LABEL } from './constants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
  onLogout: () => void;
  onResetStory: () => void;
};

export function GameHeader({
  dayCounter,
  currentLocation,
  locationIndicatorClass,
  onLogout,
  onResetStory,
}: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full select-none backdrop-blur-[6px]" role="status" aria-label="Game status">
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-[var(--candle-rule)] bg-black/40 px-2 py-0.5 font-serif text-sm text-[var(--candle-ink)] backdrop-blur-sm">
        <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-1">
          <p className="min-w-0 text-center font-serif text-sm font-medium tracking-[0.02em] text-[var(--candle-ink)]">
            Day {dayCounter}
          </p>
          <div className="flex min-w-0 justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-[var(--candle-ink-soft)] hover:bg-transparent hover:text-[var(--candle-ink)]"
                  aria-label="Game menu"
                >
                  <MoreHorizontal className="h-5 w-5" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="whisper-tooltip-surface min-w-[12rem] font-serif text-sm">
                <DropdownMenuItem
                  className="cursor-pointer font-serif text-[var(--candle-ink-soft)] focus:bg-black/30 focus:text-[var(--candle-ink)]"
                  onSelect={() => onLogout()}
                >
                  Log Out
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer font-serif text-[var(--candle-ember)] focus:bg-black/30 focus:text-[var(--candle-wax)]"
                  onSelect={() => onResetStory()}
                >
                  Reset Progress
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="min-w-0 truncate text-center font-serif text-[0.625rem] uppercase leading-none tracking-[0.18em] text-[var(--candle-ink-faint)]">
            {UI_VERSION_LABEL}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1">
          <p
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.16em] ${locationIndicatorClass}`}
          >
            {currentLocation}
          </p>
        </div>
      </div>
    </header>
  );
}
