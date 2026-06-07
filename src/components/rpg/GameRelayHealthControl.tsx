import type { GameRelayHealthSnapshot } from '@/lib/probeGameRelay';
import { useRelayHealthIndicator } from '@/lib/relayInteractionLog';
import { cn } from '@/lib/utils';
import { GameRelayStatusOverlay } from './dev/GameRelayStatusOverlay';
import { RelayHealthIndicator, relayHealthIndicatorAriaLabel } from './dev/RelayHealthIndicator';
import { HeaderFlyout } from './HeaderFlyout';

type GameRelayHealthControlProps = {
  flyoutOpen: boolean;
  onFlyoutOpenChange: (open: boolean) => void;
  snapshot: GameRelayHealthSnapshot | undefined;
  isFetching: boolean;
  onProbe: () => void;
  align?: 'start' | 'end' | 'center';
  className?: string;
};

/** Split-dot relay indicator with Status/Activity flyout — shared by title screen and game header. */
export function GameRelayHealthControl({
  flyoutOpen,
  onFlyoutOpenChange,
  snapshot,
  isFetching,
  onProbe,
  align = 'center',
  className,
}: GameRelayHealthControlProps) {
  const relayIndicatorState = useRelayHealthIndicator();

  return (
    <HeaderFlyout
      open={flyoutOpen}
      onOpenChange={onFlyoutOpenChange}
      ariaLabel={relayHealthIndicatorAriaLabel(relayIndicatorState)}
      align={align}
      panelClassName="p-0"
      trigger={
        <span
          className={cn(
            'inline-flex h-3.5 min-h-3.5 shrink-0 cursor-pointer items-center rounded-sm leading-none',
            className
          )}
        >
          <RelayHealthIndicator state={relayIndicatorState} />
        </span>
      }
    >
      <GameRelayStatusOverlay
        variant="flyout"
        snapshot={snapshot}
        isFetching={isFetching}
        onRefresh={onProbe}
      />
    </HeaderFlyout>
  );
}
