import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameRelayHealthSnapshot, GameRelayProbeResult } from '@/lib/probeGameRelay';

type GameRelayStatusOverlayProps = {
  snapshot: GameRelayHealthSnapshot | undefined;
  isFetching: boolean;
  onRefresh: () => void;
};

function statusLabel(status: GameRelayProbeResult['status']): string {
  if (status === 'up') return 'Up';
  if (status === 'timeout') return 'Slow / timeout';
  return 'Down';
}

function statusDotClass(status: GameRelayProbeResult['status']): string {
  if (status === 'up') return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]';
  if (status === 'timeout') return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]';
  return 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.55)]';
}

function formatProbeTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function GameRelayStatusOverlay({
  snapshot,
  isFetching,
  onRefresh,
}: GameRelayStatusOverlayProps) {
  const relays = snapshot?.relays ?? [];

  return (
    <aside
      className="pointer-events-auto fixed right-2 top-9 z-[60] w-[min(92vw,17rem)] rounded-md border border-[var(--candle-rule)]/80 bg-black/80 px-2.5 py-2 shadow-lg backdrop-blur-sm"
      aria-label="Game relay status"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-wax)]">
          Relay status
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 px-2 font-serif text-[0.6rem] uppercase tracking-[0.08em]"
          disabled={isFetching}
          onClick={onRefresh}
        >
          {isFetching ? '…' : 'Probe'}
        </Button>
      </div>

      <ul className="space-y-1.5">
        {relays.length === 0 ? (
          <li className="font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">Probing…</li>
        ) : (
          relays.map((relay) => (
            <li
              key={relay.url}
              className="rounded border border-[var(--candle-rule)]/50 bg-black/35 px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn('size-2 shrink-0 rounded-full', statusDotClass(relay.status))}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[0.7rem] text-[var(--candle-wax)]">
                    {relay.role === 'primary' ? 'Primary' : 'Backup'}
                  </p>
                  <p className="truncate font-mono text-[0.55rem] text-[var(--candle-ink-faint)]">
                    {relay.url.replace('wss://', '')}
                  </p>
                </div>
                <span className="shrink-0 font-serif text-[0.65rem] text-[var(--candle-ink-soft)]">
                  {statusLabel(relay.status)}
                </span>
              </div>
              <p className="mt-1 font-serif text-[0.6rem] leading-snug text-[var(--candle-ink-faint)]">
                {relay.latencyMs !== null ? `${relay.latencyMs}ms` : '—'}
                {relay.detail ? ` · ${relay.detail}` : null}
              </p>
            </li>
          ))
        )}
      </ul>

      <p className="mt-2 font-serif text-[0.55rem] leading-snug text-[var(--candle-ink-faint)]">
        {snapshot
          ? `Last probe ${formatProbeTime(snapshot.probedAtMs)} · read timeout ${snapshot.queryTimeoutMs}ms`
          : 'Uses the same relay query path as village feeds.'}
      </p>
    </aside>
  );
}
