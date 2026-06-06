/** True only for client-side abort/timeouts — not relay CLOSED / rate-limit errors. */
export function isRelayTransportFailure(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof DOMException && error.name === 'TimeoutError') return true;
  return false;
}
type RelayCacheEntry = { close: () => Promise<void> };

/** NPool keeps relays in a private map; evict so the next `.relay(url)` opens a fresh socket. */
function relayCacheMap(pool: unknown): Map<string, RelayCacheEntry> | undefined {
  if (!pool || typeof pool !== 'object') return undefined;
  return (pool as { _relays?: Map<string, RelayCacheEntry> })._relays;
}

/** Drop a cached relay connection after transport failure (idle close, timeout, etc.). */
export function recycleGameRelay(pool: unknown, url: string): void {
  const relays = relayCacheMap(pool);
  const existing = relays?.get(url);
  if (!existing || !relays) return;
  relays.delete(url);
  void existing.close().catch(() => {
    /* best-effort teardown of orphaned socket */
  });
}
