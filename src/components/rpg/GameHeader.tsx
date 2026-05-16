import { ChevronDown } from 'lucide-react';
import { UI_VERSION_LABEL } from './constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type GameHeaderProps = {
  dayCounter: number;
  currentLocation: string;
  locationIndicatorClass: string;
  /** Ordered travel destinations (Forest, optional Merchant when unlocked, …). */
  travelLocations: readonly string[];
  onTravelLocationSelect: (location: string) => void;
};

export function GameHeader({
  dayCounter,
  currentLocation,
  locationIndicatorClass,
  travelLocations,
  onTravelLocationSelect,
}: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full select-none backdrop-blur-[6px]" role="status" aria-label="Game status">
      <div className="grid min-w-0 grid-cols-3 items-center gap-1 rounded-md border border-[var(--candle-rule)] bg-black/40 px-1.5 py-px font-serif text-[var(--candle-ink)] backdrop-blur-sm">
        <p className="min-w-0 truncate text-left font-serif text-[0.5625rem] font-medium leading-none tracking-[0.02em] text-[var(--candle-ink)]">
          Day {dayCounter}
        </p>
        <p className="min-w-0 truncate text-center font-serif text-[0.5rem] uppercase leading-none tracking-[0.14em] text-[var(--candle-ink-faint)]">
          {UI_VERSION_LABEL}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className={cn(
              'inline-flex min-w-0 max-w-full items-center justify-end gap-0.5 truncate rounded-sm font-serif text-[0.5625rem] uppercase leading-none tracking-[0.14em] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0',
              locationIndicatorClass
            )}
            aria-label="Choose location"
          >
            <span className="truncate">{currentLocation}</span>
            <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-[60] min-w-[10rem] border border-[var(--candle-rule)] bg-[var(--candle-hearth)] text-[var(--candle-ink)]"
          >
            {travelLocations.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onSelect={() => onTravelLocationSelect(loc)}
                className={cn(
                  'font-serif text-sm uppercase tracking-[0.12em] focus:bg-[var(--candle-flame)]/15',
                  loc === currentLocation ? 'text-[var(--candle-wax)]' : 'text-[var(--candle-ink-soft)]'
                )}
              >
                {loc}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
