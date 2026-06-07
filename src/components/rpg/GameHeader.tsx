import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { GameRelayHealthSnapshot } from '@/lib/probeGameRelay';
import { CoinAmountDisplay } from './CoinAmountDisplay';
import { splitCopperIntoCoins } from './helpers';
import { HeaderHealthBar } from './HeaderHealthBar';
import { HeaderFlyout } from './HeaderFlyout';
import { NewDot } from './NewDot';
import { GameRelayHealthControl } from './GameRelayHealthControl';
import type { TravelMenuItem } from './travelLocations';
import { cn } from '@/lib/utils';

const DEV_TOOLS_UNLOCK_TAP_COUNT = 5;
const DEV_TOOLS_UNLOCK_WINDOW_MS = 2000;
/** Shared header strip height — matches `HeaderHealthBar` track. */
const HEADER_ROW_CLASS = 'flex h-3.5 min-h-3.5 items-center leading-none';
/** Day, coin, and location share one size/line box so baselines match. */
const HEADER_META_CLASS =
  'font-sans text-[9px] font-medium uppercase leading-none tracking-[0.02em]';

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
  walletCopper?: number;
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
  walletCopper = 0,
  relayHealthFlyoutOpen = false,
  onRelayHealthFlyoutOpenChange,
  relayHealthSnapshot,
  relayHealthFetching = false,
  onRelayHealthProbe,
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
  const coinSplit = splitCopperIntoCoins(walletCopper);

  const locationTextClass = cn(
    HEADER_META_CLASS,
    'block max-w-full truncate tracking-[0.14em]',
    locationIndicatorClass
  );

  const locationControl =
    selectableDestinations === 0 ? (
      <span className={locationTextClass}>{locationLabel}</span>
    ) : selectableDestinations === 1 ? (
      <button
        type="button"
        onClick={() => {
          const dest = travelMenuItems[0]?.locationId;
          if (dest) onTravelLocationSelect(dest);
        }}
        className={cn(
          locationTextClass,
          'rounded-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0'
        )}
        aria-label="Travel"
      >
        {locationLabel}
      </button>
    ) : (
      <HeaderFlyout
        open={locationMenuOpen}
        onOpenChange={setLocationMenuOpen}
        ariaLabel="Choose location"
        align="end"
        trigger={<span className={locationTextClass}>{locationLabel}</span>}
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

  const relayHealthControl = (
    <GameRelayHealthControl
      flyoutOpen={relayHealthFlyoutOpen}
      onFlyoutOpenChange={(open) => onRelayHealthFlyoutOpenChange?.(open)}
      snapshot={relayHealthSnapshot}
      isFetching={relayHealthFetching}
      onProbe={() => onRelayHealthProbe?.()}
      align="start"
      className="p-0"
    />
  );

  let healthControl: ReactNode;
  const healthBarClassName = 'max-w-[9.5rem] px-0.5';
  if (showHeaderDevTools && devToolsPanel) {
    if (devToolsInSideRail) {
      healthControl = (
        <>
          <div className="hidden min-w-0 flex-1 lg:block">
            <HeaderHealthBar health={health} hideMeterSemantics className={healthBarClassName} />
          </div>
          <div className="min-w-0 flex-1 lg:hidden">
            <HeaderFlyout
              open={devToolsMenuOpen}
              onOpenChange={(open) => onDevToolsMenuOpenChange?.(open)}
              ariaLabel={`Health ${health}; open developer tools`}
              align="center"
              panelClassName="max-h-[min(70vh,28rem)] w-[min(92vw,20rem)] overflow-y-auto p-2"
              trigger={
                <HeaderHealthBar health={health} hideMeterSemantics className={`cursor-pointer ${healthBarClassName}`} />
              }
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
            trigger={
              <HeaderHealthBar health={health} hideMeterSemantics className={`cursor-pointer ${healthBarClassName}`} />
            }
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
        className="flex h-3.5 min-h-3.5 min-w-0 w-full items-center rounded-sm leading-none outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[var(--candle-flame-soft)] focus-visible:ring-offset-0"
        aria-label="Health and version"
        onClick={handleDevUnlockTap}
      >
        <HeaderHealthBar health={health} hideMeterSemantics className={healthBarClassName} />
      </button>
    );
  }

  return (
    <header className="sticky top-0 z-20 w-full select-none bg-black/40 backdrop-blur-[6px]" role="status" aria-label="Game status">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 px-1.5 py-px font-sans leading-none text-[var(--candle-ink)]">
        <div className={cn(HEADER_ROW_CLASS, 'min-w-0 gap-1.5')}>
          <span className={cn(HEADER_META_CLASS, 'min-w-0 truncate text-[var(--candle-ink)]')}>
            {dayPacingActive ? `Day ${dayCounter}` : preVillageDayLabel}
          </span>
          {relayHealthControl}
        </div>
        <div className={cn(HEADER_ROW_CLASS, 'min-w-0 justify-center px-0.5')}>{healthControl}</div>
        <div className={cn(HEADER_ROW_CLASS, 'shrink-0 px-0.5')} aria-label="Wallet">
          <CoinAmountDisplay split={coinSplit} className={cn(HEADER_META_CLASS, 'tabular-nums')} />
        </div>
        <div className={cn(HEADER_ROW_CLASS, 'min-w-0 justify-end')}>{locationControl}</div>
      </div>
    </header>
  );
}
