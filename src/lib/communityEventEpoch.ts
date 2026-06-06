import type { NostrEvent } from '@nostrify/nostrify';
import { fromZonedTime } from 'date-fns-tz';

import { EASTERN_GAME_TIMEZONE } from '@/lib/easternGameTime';

/** Shared village kinds (30333–30343) plus arena/blobbi match results (10050, 10051). */
export const COMMUNITY_EVENT_KIND_MIN = 30333;
export const COMMUNITY_EVENT_KIND_MAX = 30343;
export const COMMUNITY_EVENT_EXTRA_KINDS = new Set<number>([10050, 10051]);

/**
 * Multiplayer events with `created_at` strictly before this instant are ignored by the client.
 * Bump `COMMUNITY_EVENT_EPOCH_YMD` to reset mayor votes, market, projects, etc. for everyone.
 */
export const COMMUNITY_EVENT_EPOCH_YMD = '2026-06-03';

export const COMMUNITY_EVENT_EPOCH_UNIX = Math.floor(
  fromZonedTime(`${COMMUNITY_EVENT_EPOCH_YMD}T00:00:00`, EASTERN_GAME_TIMEZONE).getTime() / 1000
);

export function isCommunityEventKind(kind: number): boolean {
  return (
    (kind >= COMMUNITY_EVENT_KIND_MIN && kind <= COMMUNITY_EVENT_KIND_MAX) ||
    COMMUNITY_EVENT_EXTRA_KINDS.has(kind)
  );
}

/** Non-community events always pass; community events must be on or after the epoch. */
export function isCommunityEventValid(event: NostrEvent): boolean {
  if (!isCommunityEventKind(event.kind)) return true;
  return event.created_at >= COMMUNITY_EVENT_EPOCH_UNIX;
}

export function filterValidCommunityEvents(events: readonly NostrEvent[]): NostrEvent[] {
  return events.filter(isCommunityEventValid);
}
