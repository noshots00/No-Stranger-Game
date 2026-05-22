import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import {
  GUILD_COMMUNITY_TAG,
  GUILD_DEF_TAG,
  GUILD_MEMBER_TAG,
  GUILD_MEMBERSHIP_D_PREFIX,
  GUILD_QUERY_LIMIT_DEFS,
  GUILD_QUERY_LIMIT_MEMBERS,
  NSG_GUILD_DEF_KIND,
  NSG_GUILD_MEMBER_KIND,
} from './constants';
import type { GuildDefinitionView } from './defaultGuild';

export type GuildMemberStatus = 'active' | 'left';

export type GuildMemberRow = {
  pubkey: string;
  name: string;
  guildSlug: string;
  joinedAtSec: number;
  status: GuildMemberStatus;
  leftAtSec?: number;
  eventId: string;
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

/** Slug for `d` tags — lowercase alphanumeric segments. */
export function slugifyGuildName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base.length > 0 ? base : 'guild';
}

export function membershipDTag(guildSlug: string): string {
  return `${GUILD_MEMBERSHIP_D_PREFIX}${guildSlug}`;
}

export function parseGuildDefinition(event: NostrEvent): GuildDefinitionView | null {
  if (event.kind !== NSG_GUILD_DEF_KIND) return null;
  const slug = tagValue(event, 'd');
  const name = tagValue(event, 'name')?.trim();
  const leaderName = tagValue(event, 'leader')?.trim();
  if (!slug || !name || !leaderName) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === GUILD_DEF_TAG)) return null;
  return {
    slug,
    name,
    leaderName,
    founderPubkey: event.pubkey,
  };
}

export function parseGuildMembership(event: NostrEvent): GuildMemberRow | null {
  if (event.kind !== NSG_GUILD_MEMBER_KIND) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === GUILD_MEMBER_TAG)) return null;

  const d = tagValue(event, 'd');
  const guildSlug = tagValue(event, 'g');
  const name = tagValue(event, 'name')?.trim();
  const joinedRaw = tagValue(event, 'joined');
  const statusRaw = tagValue(event, 'status');
  if (!d || !guildSlug || !name || !joinedRaw) return null;
  if (!d.startsWith(GUILD_MEMBERSHIP_D_PREFIX)) return null;

  const joinedAtSec = Number.parseInt(joinedRaw, 10);
  if (!Number.isFinite(joinedAtSec)) return null;

  const status: GuildMemberStatus = statusRaw === 'left' ? 'left' : 'active';
  const leftRaw = tagValue(event, 'left');
  const leftAtSec =
    leftRaw !== undefined && Number.isFinite(Number.parseInt(leftRaw, 10))
      ? Number.parseInt(leftRaw, 10)
      : undefined;

  return {
    pubkey: event.pubkey,
    name,
    guildSlug,
    joinedAtSec,
    status,
    leftAtSec,
    eventId: event.id,
  };
}

export const guildDefFilter = (): NostrFilter => ({
  kinds: [NSG_GUILD_DEF_KIND],
  '#t': [GUILD_DEF_TAG],
  limit: GUILD_QUERY_LIMIT_DEFS,
});

export function guildMembersFilter(guildSlug: string): NostrFilter {
  return {
    kinds: [NSG_GUILD_MEMBER_KIND],
    '#t': [GUILD_MEMBER_TAG],
    '#g': [guildSlug],
    limit: GUILD_QUERY_LIMIT_MEMBERS,
  };
}

/** Latest membership row per pubkey (replaceable semantics). */
export function latestMembersByPubkey(events: readonly NostrEvent[]): GuildMemberRow[] {
  const byPubkey = new Map<string, { row: GuildMemberRow; createdAt: number }>();
  for (const event of events) {
    const row = parseGuildMembership(event);
    if (!row) continue;
    const prev = byPubkey.get(row.pubkey);
    if (!prev || event.created_at >= prev.createdAt) {
      byPubkey.set(row.pubkey, { row, createdAt: event.created_at });
    }
  }
  return Array.from(byPubkey.values())
    .map((e) => e.row)
    .sort((a, b) => a.joinedAtSec - b.joinedAtSec);
}

export function mergeGuildDefinitions(
  defaultGuild: GuildDefinitionView,
  relayDefs: readonly GuildDefinitionView[]
): GuildDefinitionView[] {
  const out: GuildDefinitionView[] = [defaultGuild];
  const seen = new Set<string>([defaultGuild.slug]);
  for (const def of relayDefs) {
    if (seen.has(def.slug)) continue;
    seen.add(def.slug);
    out.push(def);
  }
  return out;
}

export function resolveUniqueGuildSlug(
  baseName: string,
  existingSlugs: ReadonlySet<string>
): string {
  const slug = slugifyGuildName(baseName);
  if (!existingSlugs.has(slug)) return slug;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${slug}-${i}`;
    if (!existingSlugs.has(candidate)) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

export function buildGuildDefDraft(args: {
  slug: string;
  name: string;
  leaderName: string;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  return {
    kind: NSG_GUILD_DEF_KIND,
    content: '',
    created_at,
    tags: [
      ['d', args.slug],
      ['t', GUILD_COMMUNITY_TAG],
      ['t', GUILD_DEF_TAG],
      ['name', args.name],
      ['leader', args.leaderName],
      ['alt', 'Guild definition for No Stranger Game'],
    ],
  };
}

export function buildMembershipDraft(args: {
  guildSlug: string;
  playerName: string;
  joinedAtSec?: number;
  status?: GuildMemberStatus;
  leftAtSec?: number;
  createdAtSec?: number;
}): Omit<NostrEvent, 'id' | 'pubkey' | 'sig'> {
  const joined = args.joinedAtSec ?? Math.floor(Date.now() / 1000);
  const status = args.status ?? 'active';
  const created_at = args.createdAtSec ?? Math.floor(Date.now() / 1000);
  const tags: string[][] = [
    ['d', membershipDTag(args.guildSlug)],
    ['t', GUILD_COMMUNITY_TAG],
    ['t', GUILD_MEMBER_TAG],
    ['g', args.guildSlug],
    ['name', args.playerName],
    ['joined', String(joined)],
    ['status', status],
    ['alt', 'Guild membership for No Stranger Game'],
  ];
  if (status === 'left' && args.leftAtSec !== undefined) {
    tags.push(['left', String(args.leftAtSec)]);
  }
  return {
    kind: NSG_GUILD_MEMBER_KIND,
    content: '',
    created_at,
    tags,
  };
}

/**
 * MVP trust: membership and guild defs are author-published.
 * Relays do not enforce roster integrity — same limitation as arena match events.
 */
