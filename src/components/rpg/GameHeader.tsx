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
    <header className="sticky top-0 z-20 -mx-1 grid grid-cols-4 items-center gap-2 px-1 py-0 backdrop-blur-[6px]">
      <p className="text-center font-serif text-sm font-medium tracking-[0.02em] text-[var(--candle-ink)]">
        Day {dayCounter}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mx-auto h-9 w-9 shrink-0 text-[var(--candle-ink-soft)] hover:bg-transparent hover:text-[var(--candle-ink)]"
            aria-label="Game menu"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="whisper-tooltip-surface min-w-[11rem] font-serif text-sm">
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
      <p className="text-center font-serif text-[10px] uppercase leading-none tracking-[0.18em] text-[var(--candle-ink-faint)]">
        {UI_VERSION_LABEL}
      </p>
      <p
        className={`justify-self-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${locationIndicatorClass}`}
      >
        {currentLocation}
      </p>
    </header>
  );
}
