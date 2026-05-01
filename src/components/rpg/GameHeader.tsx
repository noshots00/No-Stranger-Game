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
    <header className="sticky top-0 z-20 -mx-1 px-1 pb-4 pt-1 backdrop-blur-[6px]">
      <div className="flex min-h-[2.75rem] items-start justify-between gap-3">
        <p className="shrink-0 pt-1 font-serif text-sm font-medium tracking-[0.02em] text-[var(--candle-ink)]">
          Day {dayCounter}
        </p>
        <p className="pointer-events-none flex-1 pt-2 text-center text-[10px] uppercase leading-none tracking-[0.18em] text-[var(--candle-ink-faint)]">
          {UI_VERSION_LABEL}
        </p>
        <div className="flex shrink-0 items-start gap-0">
          <p
            className={`${locationIndicatorClass} max-w-[9rem] truncate pt-1 text-right text-[10px] uppercase leading-snug tracking-[0.18em] sm:max-w-[11rem]`}
          >
            {currentLocation}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-[var(--candle-ink-soft)] hover:bg-transparent hover:text-[var(--candle-ink)]"
                aria-label="Game menu"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="whisper-tooltip-surface min-w-[11rem] font-serif text-sm">
              <DropdownMenuItem
                className="cursor-pointer font-serif text-[var(--candle-ink)] focus:bg-black/30 focus:text-[var(--candle-wax)]"
                onSelect={() => onAdvanceDay()}
              >
                Advance 24 hours
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-serif text-[var(--candle-ink-soft)] focus:bg-black/30 focus:text-[var(--candle-ink)]"
                onSelect={() => onLogout()}
              >
                Log out
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-serif text-[var(--candle-ember)] focus:bg-black/30 focus:text-[var(--candle-wax)]"
                onSelect={() => onResetStory()}
              >
                Reset story
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
