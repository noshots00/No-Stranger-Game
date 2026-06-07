import { useCallback, useRef, useState, type ReactNode } from 'react';
import { HeaderHealthBar } from './HeaderHealthBar';
import { HeaderFlyout } from './HeaderFlyout';
import { NewDot } from './NewDot';
import type { TravelMenuItem } from './travelLocations';
import { cn } from '@/lib/utils';

const DEV_TOOLS_UNLOCK_TAP_COUNT = 5;
const DEV_TOOLS_UNLOCK_WINDOW_MS = 2000;

type GameHeaderProps = {
  dayCounter: number;
  dayPacingActive?: boolean;
  preVillageDayLabel?: string;
  currentLocation: string;
  travelMenuHighlightLocation?: string;
  formatLocationLabel?: (location: string) => string;
  locationIndicatorClass: string;
  travelMenuItems: readonly TravelMenuItem[];
  onTravelLocationSelect: (location: string) => void;
  showHeaderDevTools?: boolean;
  /** When true, dev panel lives in the desktop left gutter (hide header flyout on lg+). */
  devToolsInSideRail?: boolean;
  devToolsPanel?: ReactNode;
  devToolsMenuOpen?: boolean;
  onDevToolsMenuOpenChange?: (open: boolean) => void;
  onEnableDevTools?: () => void;
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
  onTravelLocationSelect,
  showHeaderDevTools = false,
  devToolsInSideRail = false,
  devToolsPanel,
  devToolsMenuOpen = false,
  onDevToolsMenuOpenChange,
  onEnableDevTools,
  health = 100,
}: GameHeaderProps) {
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const devUnlockTapCountRef = useRef(0);
  const devUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDevUnlockTap = useCallback(() => {
    if (showHeaderDevTools || !onEnableDevTools) return;
    devUnlockTapCountRef.current += 1;
    if (devUnlockTimerRef.current) clearTimeout(devUnlockTimerRef.current);
    if (devUnlockTapCountRef.current >= DEV_TOOLS_UNLOCK_TAP_COUNT) {
      devUnlockTapCountRef.current = 0;
      onEnableDevTools();
      return;
    }
    devUnlockTimerRef.current = setTimeout(() => {
      devUnlockTapCountRef.current = 0;
      devUnlockTimerRef.current = null;
    }, DEV_TOOLS_UNLOCK_WINDOW_MS);
  }, [onEnableDevTools, showHeaderDevTools]);
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
        aria-label="Travel"
      >
        {locationTrigger}
      </button>
    ) : (
      <HeaderFlyout
        open={locationMenuOpen}
        onOpenChange={setLocationMenuOpen}
        ariaLabel="Choose location"
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
                {item.showNew ? <NewDot /> : null}
              </button>
            </li>
          ))}
        </ul>
      </HeaderFlyout>
    );

  const versionCell =
    showHeaderDevTools && devToolsPanel ? (
      <>
        {devToolsInSideRail ? (
          <div className="mx-auto hidden w-full max-w-[4.75rem] lg:block">
            <HeaderHealthBar health={health} hideMeterSemantics className="px-0.5" />
          </div>
        ) : null}
        <div className={devToolsInSideRail ? 'lg:hidden' : undefined}>
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
        </div>
      </>
    ) : (
      <button
        type="button"
        className="mx-auto block w-full max-w-[4.75rem] rounded-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0"
        aria-label="Health and version"
        onClick={handleDevUnlockTap}
      >
        <HeaderHealthBar health={health} hideMeterSemantics className="px-0.5" />
      </button>
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
