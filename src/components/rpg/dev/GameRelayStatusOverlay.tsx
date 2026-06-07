import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameRelayHealthSnapshot, GameRelayProbeResult } from '@/lib/probeGameRelay';
import { GAME_RELAY_URLS } from '@/lib/gameRelays';
import {
  useRelayInteractionLog,
  type RelayInteractionEntry,
} from '@/lib/relayInteractionLog';

type GameRelayStatusOverlayProps = {
  snapshot: GameRelayHealthSnapshot | undefined;
  isFetching: boolean;
  onRefresh: () => void;
  /** `overlay` floats on narrow screens; `rail` fills the desktop side gutter; `flyout` sits in header dropdown. */
  variant?: 'overlay' | 'rail' | 'flyout';
};

type OverlayPanel = 'status' | 'activity';

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

function shortRelayHost(url: string): string {
  return url.replace('wss://', '');
}

function operationLabel(op: RelayInteractionEntry['operation']): string {
  if (op === 'query') return 'REQ';
  if (op === 'publish') return 'PUB';
  return 'PROBE';
}

function ActivityRow({ entry }: { entry: RelayInteractionEntry }) {
  const host = shortRelayHost(entry.relayUrl);
  const isPrimary = entry.relayUrl === GAME_RELAY_URLS[0];
  return (
    <li
      className={cn(
        'rounded border px-2 py-1 font-mono text-[0.55rem] leading-snug',
        entry.ok
          ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-100/90'
          : 'border-red-900/50 bg-red-950/25 text-red-100/90'
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[var(--candle-ink-faint)]">{formatProbeTime(entry.atMs)}</span>
        <span className="uppercase tracking-wide">
          {operationLabel(entry.operation)} · {isPrimary ? 'pri' : 'bak'}
        </span>
      </div>
      <p className="truncate text-[var(--candle-wax)]">{host}</p>
      <p className="text-[var(--candle-ink-faint)]">
        {entry.latencyMs}ms
        {entry.eventCount !== undefined ? ` · ${entry.eventCount} evt` : ''}
        {' · '}
        {entry.detail}
      </p>
    </li>
  );
}

export function GameRelayStatusOverlay({
  snapshot,
  isFetching,
  onRefresh,
  variant = 'overlay',
}: GameRelayStatusOverlayProps) {
  const [panel, setPanel] = useState<OverlayPanel>('status');
  const { entries, totals, clearLog } = useRelayInteractionLog();
  const relays = snapshot?.relays ?? [];
  const isRail = variant === 'rail';
  const isFlyout = variant === 'flyout';

  return (
    <aside
      className={cn(
        'pointer-events-auto flex flex-col rounded-md border border-[var(--candle-rule)]/80 bg-black/85 shadow-lg backdrop-blur-sm',
        isRail && 'max-h-[min(calc(100dvh-2rem),40rem)] w-full',
        isFlyout && 'max-h-[min(70vh,28rem)] w-[min(92vw,20rem)]',
        variant === 'overlay' &&
          'fixed right-2 top-9 z-[60] w-[min(92vw,20rem)] max-h-[min(70vh,28rem)] lg:hidden'
      )}
      aria-label="Game relay status"
    >
      <div className="shrink-0 border-b border-[var(--candle-rule)]/50 px-2.5 py-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-wax)]">
            Game relays
          </p>
          <div className="flex gap-1">
            {panel === 'status' ? (
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
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 px-2 font-serif text-[0.6rem] uppercase tracking-[0.08em]"
                onClick={clearLog}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-md border border-[var(--candle-rule)]/50 bg-black/30 p-0.5">
          <button
            type="button"
            className={cn(
              'rounded-sm px-2 py-1 font-serif text-[0.6rem] uppercase tracking-[0.1em]',
              panel === 'status'
                ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                : 'text-[var(--candle-ink-soft)]'
            )}
            onClick={() => setPanel('status')}
          >
            Status
          </button>
          <button
            type="button"
            className={cn(
              'rounded-sm px-2 py-1 font-serif text-[0.6rem] uppercase tracking-[0.1em]',
              panel === 'activity'
                ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                : 'text-[var(--candle-ink-soft)]'
            )}
            onClick={() => setPanel('activity')}
          >
            Activity ({totals.total})
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        {panel === 'status' ? (
          <>
            <ul className="space-y-1.5">
              {relays.length === 0 ? (
                <li className="font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
                  Click Probe to check relays.
                </li>
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
                          {shortRelayHost(relay.url)}
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
                ? `Last probe ${formatProbeTime(snapshot.probedAtMs)} · timeout ${snapshot.queryTimeoutMs}ms`
                : 'Manual probe only.'}
            </p>
          </>
        ) : (
          <div className="space-y-2">
            <div className="rounded border border-[var(--candle-rule)]/50 bg-black/35 px-2 py-1.5 font-mono text-[0.55rem] text-[var(--candle-ink-soft)]">
              <p>
                Total {totals.total} · ok {totals.ok} · fail {totals.failed}
              </p>
              <p>
                REQ {totals.queries} · PUB {totals.publishes} · PROBE {totals.probes}
              </p>
              <p className="mt-1 text-[var(--candle-ink-faint)]">
                {GAME_RELAY_URLS.map((url, i) => {
                  const row = totals.byRelay[url];
                  const label = i === 0 ? 'pri' : 'bak';
                  return `${label} ${row?.total ?? 0} (${row?.ok ?? 0} ok)`;
                }).join(' · ')}
              </p>
            </div>

            {entries.length === 0 ? (
              <p className="py-4 text-center font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
                No relay traffic yet. Play the game to populate this log.
              </p>
            ) : (
              <ul className="space-y-1">
                {entries.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
