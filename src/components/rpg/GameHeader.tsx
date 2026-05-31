import { useState, type ReactNode } from 'react';
import { HeaderHealthBar } from './HeaderHealthBar';
import { HeaderFlyout } from './HeaderFlyout';
import type { TravelMenuItem } from './travelLocations';
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
  dayPacingActive?: boolean;
  preVillageDayLabel?: string;
  currentLocation: string;
  travelMenuHighlightLocation?: string;
  formatLocationLabel?: (location: string) => string;
  locationIndicatorClass: string;
  travelMenuItems: readonly TravelMenuItem[];
  locationMenuNotify?: boolean;
  onTravelLocationSelect: (location: string) => void;
  showHeaderDevTools?: boolean;
  devToolsPanel?: ReactNode;
  devToolsMenuOpen?: boolean;
  onDevToolsMenuOpenChange?: (open: boolean) => void;
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
  devToolsMenuOpen = false,
  onDevToolsMenuOpenChange,
  health = 100,
}: GameHeaderProps) {
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const menuHighlight = travelMenuHighlightLocation ?? currentLocation;
  const selectableDestinations = travelMenuItems.length;
  const locationLabel = formatLocationLabel(currentLocation);

  const locationTrigger = (
    <span
      className={cn(
        'relative inline-flex min-w-0 max-w-full items-center justify-end gap-0.5 truncate font-sans text-[9px] uppercase leading-none tracking-[0.14em]',
        locationIndicatorClass
      )}
    >
      <span className="truncate">{locationLabel}</span>
      {locationMenuNotify ? <TravelNewDot className="ml-0.5" /> : null}
    </span>
  );

  const locationControl =
    selectableDestinations === 0 ? (
      <span
        className={cn(
          'inline-flex min-w-0 max-w-full items-center justify-end truncate font-sans text-[9px] uppercase leading-none tracking-[0.14em]',
          locationIndicatorClass
        )}
      >
        {locationLabel}
        {locationMenuNotify ? <TravelNewDot className="ml-0.5" /> : null}
      </span>
    ) : selectableDestinations === 1 ? (
      <button
        type="button"
        onClick={() => {
          const dest = travelMenuItems[0]?.locationId;
          if (dest) onTravelLocationSelect(dest);
        }}
        className={cn(
          'relative inline-flex min-w-0 max-w-full items-center justify-end gap-0.5 truncate rounded-sm font-sans text-[9px] uppercase leading-none tracking-[0.14em] outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0',
          locationIndicatorClass
        )}
        aria-label={locationMenuNotify ? 'Travel (new place available)' : 'Travel'}
      >
        {locationTrigger}
      </button>
    ) : (
      <HeaderFlyout
        open={locationMenuOpen}
        onOpenChange={setLocationMenuOpen}
        ariaLabel={locationMenuNotify ? 'Choose location (new places available)' : 'Choose location'}
        align="end"
        trigger={locationTrigger}
      >
        <ul className="flex flex-col gap-0.5 p-0.5">
          {travelMenuItems.map((item) => (
            <li key={item.locationId}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 font-serif text-sm uppercase tracking-[0.12em] hover:bg-[var(--candle-flame)]/15',
                  item.indent ? 'pl-4' : undefined,
                  item.locationId === menuHighlight
                    ? 'text-[var(--candle-wax)]'
                    : 'text-[var(--candle-ink-soft)]'
                )}
                onClick={() => {
                  onTravelLocationSelect(item.locationId);
                  setLocationMenuOpen(false);
                }}
              >
                <span className="truncate text-left">{item.label}</span>
                {item.showNew ? <TravelNewDot /> : null}
              </button>
            </li>
          ))}
        </ul>
      </HeaderFlyout>
    );

  const versionCell =
    showHeaderDevTools && devToolsPanel ? (
      <HeaderFlyout
        open={devToolsMenuOpen}
        onOpenChange={(open) => onDevToolsMenuOpenChange?.(open)}
        ariaLabel={`Health ${health}; open developer tools`}
        align="center"
        panelClassName="max-h-[min(70vh,28rem)] w-[min(92vw,20rem)] overflow-y-auto p-2"
        trigger={<HeaderHealthBar health={health} hideMeterSemantics className="cursor-pointer" />}
      >
        {devToolsPanel}
      </HeaderFlyout>
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
        <div className="flex min-w-0 justify-end">{locationControl}</div>
      </div>
    </header>
  );
}
