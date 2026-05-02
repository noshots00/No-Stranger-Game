/**
 * Tiny NIP-29 relay-managed group chat helpers.
 *
 * - All chat traffic targets ONE specific group-relay (default: relay.0xchat.com)
 *   so messages do NOT appear on the user's regular nostr profile feed and
 *   total network noise stays low.
 * - Group IDs are stable strings derived from the game's domain ("global" and
 *   per-location slugs).
 * - Privacy stance: the relay can read content. Acceptable trade-off documented
 *   in docs/design/VISION.md > Chat Defaults and the SECURITY_AUDIT.
 */

/** Default group-chat relay. Configurable in the future via AppConfig.chatRelay. */
export const DEFAULT_CHAT_RELAY = 'wss://relay.0xchat.com';

/** NIP-29 chat message kind. */
export const NIP29_CHAT_KIND = 9;

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

/** Build the unsigned NIP-29 message template for a chat send. */
export function buildChatMessageTemplate(
  groupId: string,
  content: string
): { kind: number; content: string; tags: string[][]; created_at: number } {
  return {
    kind: NIP29_CHAT_KIND,
    content,
    tags: [['h', groupId]],
    created_at: Math.floor(Date.now() / 1000),
  };
}
