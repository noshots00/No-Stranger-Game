import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { GameRelayHealthSnapshot } from '@/lib/probeGameRelay';
import { useRelayHealthIndicator } from '@/lib/relayInteractionLog';
import { HeaderHealthBar } from './HeaderHealthBar';
import { HeaderFlyout } from './HeaderFlyout';
import { NewDot } from './NewDot';
import { GameRelayStatusOverlay } from './dev/GameRelayStatusOverlay';
import { RelayHealthIndicator, relayHealthIndicatorAriaLabel } from './dev/RelayHealthIndicator';
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
  relayHealthFlyoutOpen?: boolean;
  onRelayHealthFlyoutOpenChange?: (open: boolean) => void;
  relayHealthSnapshot?: GameRelayHealthSnapshot;
  relayHealthFetching?: boolean;
  onRelayHealthProbe?: () => void;
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
  relayHealthFlyoutOpen = false,
  onRelayHealthFlyoutOpenChange,
  relayHealthSnapshot,
  relayHealthFetching = false,
  onRelayHealthProbe,
}: GameHeaderProps) {
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const devUnlockTapCountRef = useRef(0);
  const devUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relayIndicatorState = useRelayHealthIndicator();

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

  const relayHealthControl = showHeaderDevTools ? (
    <HeaderFlyout
      open={relayHealthFlyoutOpen}
      onOpenChange={(open) => onRelayHealthFlyoutOpenChange?.(open)}
      ariaLabel={relayHealthIndicatorAriaLabel(relayIndicatorState)}
      align="center"
      panelClassName="p-0"
      trigger={
        <span className="inline-flex shrink-0 cursor-pointer rounded-sm p-0.5">
          <RelayHealthIndicator state={relayIndicatorState} />
        </span>
      }
    >
      <GameRelayStatusOverlay
        variant="flyout"
        snapshot={relayHealthSnapshot}
        isFetching={relayHealthFetching}
        onRefresh={() => onRelayHealthProbe?.()}
      />
    </HeaderFlyout>
  ) : null;

  let healthControl: ReactNode;
  if (showHeaderDevTools && devToolsPanel) {
    if (devToolsInSideRail) {
      healthControl = (
        <>
          <div className="hidden min-w-0 flex-1 lg:block">
            <HeaderHealthBar health={health} hideMeterSemantics className="px-0.5" />
          </div>
          <div className="min-w-0 flex-1 lg:hidden">
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
      );
    } else {
      healthControl = (
        <div className="min-w-0 flex-1">
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
      );
    }
  } else {
    healthControl = (
      <button
        type="button"
        className="min-w-0 flex-1 rounded-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0"
        aria-label="Health and version"
        onClick={handleDevUnlockTap}
      >
        <HeaderHealthBar health={health} hideMeterSemantics className="px-0.5" />
      </button>
    );
  }

  const versionCell = (
    <div className="mx-auto flex min-w-0 max-w-[6rem] items-center justify-center gap-1">
      {healthControl}
      {relayHealthControl}
    </div>
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
