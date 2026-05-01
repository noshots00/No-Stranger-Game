import type { NostrEvent } from '@nostrify/nostrify';

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
