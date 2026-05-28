/**
 * Tiny NIP-29 relay-managed group chat helpers.
 *
 * - Group chat uses the same game relays as the main pool (ditto.pub + dreamith.to).
 *   so messages do NOT appear on the user's regular nostr profile feed and
 *   total network noise stays low.
 * - Group IDs are stable strings derived from the game's domain ("global" and
 *   per-location slugs).
 * - Privacy stance: the relay can read content. Acceptable trade-off documented
 *   in docs/design/VISION.md > Chat Defaults and the SECURITY_AUDIT.
 */

/** @deprecated Prefer `GAME_RELAY_URLS` / relay group in `useChatRoom`. */
export const DEFAULT_CHAT_RELAY = 'wss://relay.ditto.pub';

/**
 * Group room messages use kind 9 + `h` room id (NIP-29 style).
 * Legacy kind 1 + `t` is still read for older messages.
 */
export const GAME_CHAT_MESSAGE_KIND = 9;
/** @deprecated Read path only — older public-note chat messages. */
export const LEGACY_GAME_CHAT_KIND = 1;
export const GAME_CHAT_COMMUNITY_T = 'no-stranger-game-chat';

const GLOBAL_GROUP_ID = 'no-stranger-game-global';

/** Lower-case kebab slug of a free-text location label (e.g. "Silver Lake" -> "silver-lake"). */
export function slugifyLocation(location: string): string {
  return location
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Stable global group id (Social tab default room). */
export function getGlobalGroupId(): string {
  return GLOBAL_GROUP_ID;
}

/** Stable per-location group id (Play tab default room). */
export function getLocationGroupId(location: string): string {
  const slug = slugifyLocation(location) || 'unknown';
  return `no-stranger-game-loc-${slug}`;
}

/** Build the unsigned group-room message template for a chat send. */
export function buildChatMessageTemplate(
  groupId: string,
  content: string
): { kind: number; content: string; tags: string[][]; created_at: number } {
  return {
    kind: GAME_CHAT_MESSAGE_KIND,
    content,
    tags: [
      ['h', groupId],
      ['t', GAME_CHAT_COMMUNITY_T],
      ['alt', `No Stranger Game chat (${groupId})`],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}
