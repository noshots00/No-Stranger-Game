import type { NostrEvent } from '@nostrify/nostrify';

/** Kind 1 community feed: only people you follow (client-filtered). */
export const NSG_SOCIAL_FEED_T = 'no-stranger-game-feed';

/** Kind 1 open “signals” timeline (permissionless; optional pinned ids via env). */
export const NSG_SOCIAL_SIGNAL_T = 'no-stranger-game-signals';

/** Kind 1 public lobby chat room. */
export const NSG_SOCIAL_LOBBY_T = 'no-stranger-game-lobby';

export function extractFollowPubkeysFromContactList(event: NostrEvent | undefined): Set<string> {
  if (!event) return new Set();
  return new Set(
    event.tags
      .filter(([name, value]) => name === 'p' && Boolean(value))
      .map(([, value]) => value)
  );
}

export function truncatePlaintext(content: string, max: number): string {
  const t = content.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

/** Hex event ids from `VITE_NSG_SOCIAL_PINNED_NOTE_IDS` (comma-separated), max 5. */
export function parsePinnedNoteIdsFromEnv(): string[] {
  const raw = import.meta.env.VITE_NSG_SOCIAL_PINNED_NOTE_IDS;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5);
}
