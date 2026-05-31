import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { HeaderHealthBar } from './HeaderHealthBar';
import type { TravelMenuItem } from './travelLocations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

function TravelNewDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'size-1.5 shrink-0 rounded-full bg-[var(--candle-flame-soft)] shadow-[0_0_6px_rgba(230,161,87,0.55)]',
        className
      )}
      aria-hidden
    />
  );
}

type GameHeaderProps = {
  dayCounter: number;
  /** When false, header shows `preVillageDayLabel` instead of the calendar day. */
  dayPacingActive?: boolean;
  /** Shown left of header when `dayPacingActive` is false (creation arc / forest binge). */
  preVillageDayLabel?: string;
  /** Shown in the header (parent hub — e.g. The Forest, not Old Well). */
  currentLocation: string;
  /** Highlights the active row in the travel menu (may be a forest sub-location). */
  travelMenuHighlightLocation?: string;
  /** Maps persisted location id to header/travel menu label (storage stays canonical). */
  formatLocationLabel?: (location: string) => string;
  locationIndicatorClass: string;
  /** Forest hub + optional sub-locations and other travel destinations. */
  travelMenuItems: readonly TravelMenuItem[];
  /** Pings on the header location control until required menu entries are acknowledged. */
  locationMenuNotify?: boolean;
  onTravelLocationSelect: (location: string) => void;
  /** When set, version label opens a scrollable dev panel (`devToolsPanel`). */
  showHeaderDevTools?: boolean;
  devToolsPanel?: ReactNode;
  devToolsMenuOpen?: boolean;
  onDevToolsMenuOpenChange?: (open: boolean) => void;
  /** Player health 0–100 (center header HP bar). */
  health?: number;
};

export function GameHeader({
  dayCounter,
  dayPacingActive = true,
  preVillageDayLabel = 'The Forest',
  currentLocation,
  travelMenuHighlightLocation,
  formatLocationLabel = (loc) => loc,
  locationIndicatorClass,
  travelMenuItems,
  locationMenuNotify = false,
  onTravelLocationSelect,
  showHeaderDevTools = false,
  devToolsPanel,
  devToolsMenuOpen,
  onDevToolsMenuOpenChange,
  health = 100,
}: GameHeaderProps) {
  const versionCell =
    showHeaderDevTools && devToolsPanel ? (
      <DropdownMenu open={devToolsMenuOpen} onOpenChange={onDevToolsMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="mx-auto block w-full max-w-[4.75rem] rounded-sm bg-transparent p-0 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0"
            aria-label={`Health ${health}; open developer tools`}
          >
            <HeaderHealthBar health={health} hideMeterSemantics />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="z-[60] max-h-[min(70vh,28rem)] w-[min(92vw,20rem)] overflow-y-auto border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-2 text-[var(--candle-ink)]"
        >
          {devToolsPanel}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <HeaderHealthBar health={health} className="px-0.5" />
    );

  return (
    <header className="sticky top-0 z-20 w-full select-none bg-black/40 backdrop-blur-[6px]" role="status" aria-label="Game status">
      <div className="grid min-w-0 grid-cols-3 items-center gap-1 px-1.5 py-px font-serif text-[var(--candle-ink)]">
        <p className="min-w-0 truncate text-left font-sans text-[9px] font-medium leading-none tracking-[0.02em] text-[var(--candle-ink)]">
          {dayPacingActive ? `Day ${dayCounter}` : preVillageDayLabel}
        </p>
        {versionCell}
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className={cn(
              'relative inline-flex min-w-0 max-w-full items-center justify-end gap-0.5 truncate rounded-sm font-sans text-[9px] uppercase leading-none tracking-[0.14em] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0',
              locationIndicatorClass
            )}
            aria-label={locationMenuNotify ? 'Choose location (new places available)' : 'Choose location'}
          >
            <span className="truncate">{formatLocationLabel(currentLocation)}</span>
            {locationMenuNotify ? <TravelNewDot className="mr-0.5" /> : null}
            <ChevronDown className="size-3 shrink-0 opacity-70" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-[60] min-w-[10rem] border border-[var(--candle-rule)] bg-[var(--candle-hearth)] text-[var(--candle-ink)]"
          >
            {travelMenuItems.map((item) => {
              const menuHighlight = travelMenuHighlightLocation ?? currentLocation;
              return (
              <DropdownMenuItem
                key={item.locationId}
                onSelect={() => onTravelLocationSelect(item.locationId)}
                className={cn(
                  'flex items-center justify-between gap-2 font-serif text-sm uppercase tracking-[0.12em] focus:bg-[var(--candle-flame)]/15',
                  item.indent ? 'pl-6' : undefined,
                  item.locationId === menuHighlight ? 'text-[var(--candle-wax)]' : 'text-[var(--candle-ink-soft)]'
                )}
              >
                <span className="truncate">{item.label}</span>
                {item.showNew ? <TravelNewDot /> : null}
              </DropdownMenuItem>
            );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
