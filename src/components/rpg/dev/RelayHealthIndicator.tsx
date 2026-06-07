import { cn } from '@/lib/utils';
import type { RelayHealthIndicatorState, RelayLegIndicatorStatus } from '@/lib/relayInteractionLog';

type RelayHealthIndicatorProps = {
  state: RelayHealthIndicatorState;
  className?: string;
};

function legColor(status: RelayLegIndicatorStatus, inFlight: boolean): string {
  if (inFlight) return 'bg-amber-400';
  if (status === 'ok') return 'bg-emerald-400';
  if (status === 'failed') return 'bg-red-500';
  return 'bg-zinc-500/70';
}

function buildAriaLabel(state: RelayHealthIndicatorState): string {
  if (state.inFlight) return 'Game relay request in progress';

  const describe = (role: string, status: RelayLegIndicatorStatus) => {
    if (status === 'unknown') return `${role} relay idle`;
    return `${role} relay ${status === 'ok' ? 'up' : 'down'}`;
  };

  const primary = describe('Primary', state.primaryStatus);
  const backup = describe('Backup', state.backupStatus);
  const op = state.latestOperation ? ` after latest ${state.latestOperation}` : '';
  return `${primary}; ${backup}${op}. Open relay status panel.`;
}

/** Split-dot header indicator: primary (left) and backup (right) relay legs. */
export function RelayHealthIndicator({ state, className }: RelayHealthIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex h-2.5 w-4 shrink-0 overflow-hidden rounded-full border border-[var(--candle-rule)]/60',
        state.inFlight && 'animate-pulse',
        className
      )}
      aria-hidden
    >
      <span
        className={cn('h-full w-1/2', legColor(state.primaryStatus, state.inFlight))}
        title="Primary relay"
      />
      <span
        className={cn('h-full w-1/2', legColor(state.backupStatus, state.inFlight))}
        title="Backup relay"
      />
    </span>
  );
}

export function relayHealthIndicatorAriaLabel(state: RelayHealthIndicatorState): string {
  return buildAriaLabel(state);
}
