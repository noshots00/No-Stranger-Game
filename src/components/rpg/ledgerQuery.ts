/** Shared TanStack Query defaults for village ledger panels (manual refresh only). */
export const LEDGER_QUERY_OPTIONS = {
  enabled: false as const,
  staleTime: Infinity,
  retry: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  /** Keep relay snapshots between Town Hall visits in the same session. */
  gcTime: 1000 * 60 * 60,
} as const;

/**
 * Return the previous cache reference when serialized data is unchanged so refetches
 * do not re-render panels when the relay had nothing new.
 */
export function keepQueryDataIfUnchanged<T>(prev: T | undefined, next: T): T {
  if (prev === undefined) return next;
  try {
    if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
  } catch {
    /* non-JSON-serializable — fall through */
  }
  return next;
}
