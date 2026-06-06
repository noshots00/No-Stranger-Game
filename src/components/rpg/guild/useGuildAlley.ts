import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { GuildMembership, ModifierMap, QuestState } from '../quests/types';
import { DEFAULT_GUILD } from './defaultGuild';
import {
  GUILD_CREATE_GOLD_DELTA,
  GUILD_CREATE_COST_GOLD,
  hasAtLeastGold,
} from './guildEconomy';
import {
  buildGuildDefDraft,
  buildMembershipDraft,
  guildDefFilter,
  guildMembersFilter,
  latestMembersByPubkey,
  mergeGuildDefinitions,
  parseGuildDefinition,
  resolveUniqueGuildSlug,
} from './guildNostr';
import type { GuildDefinitionView } from './defaultGuild';
import type { GuildMemberRow } from './guildNostr';

const GUILD_FEED_KEY = ['guild-alley-feed'] as const;

export type GuildAlleyFeed = {
  guilds: GuildDefinitionView[];
  membersBySlug: Record<string, GuildMemberRow[]>;
};

async function fetchGuildFeed(
  nostr: { query: (f: ReturnType<typeof guildDefFilter>[]) => Promise<unknown[]> }
): Promise<GuildAlleyFeed> {
  const defEvents = (await nostr.query([guildDefFilter()])) as NostrEvent[];
  const relayDefs = defEvents
    .map(parseGuildDefinition)
    .filter((d): d is GuildDefinitionView => d !== null);

  const guilds = mergeGuildDefinitions(DEFAULT_GUILD, relayDefs);
  const slugs = guilds.map((g) => g.slug);

  const memberResults = await Promise.all(
    slugs.map(async (slug) => {
      const events = (await nostr.query([guildMembersFilter(slug)])) as NostrEvent[];
      return [slug, latestMembersByPubkey(events)] as const;
    })
  );

  const membersBySlug: Record<string, GuildMemberRow[]> = {};
  for (const [slug, rows] of memberResults) {
    membersBySlug[slug] = rows;
  }

  return { guilds, membersBySlug };
}

function isActiveMember(row: GuildMemberRow): boolean {
  return row.status === 'active';
}

export function useGuildAlley(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
  setQuestState: React.Dispatch<React.SetStateAction<QuestState>>;
  persistQuestCheckpoint: (state: QuestState) => void | Promise<void>;
  onApplyModifiers: (delta: ModifierMap) => void;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const membership = args.questState.guildMembership ?? null;
  const hasActiveMembership = membership !== null && membership.leftAtMs === undefined;

  const feedQuery = useQuery({
    queryKey: GUILD_FEED_KEY,
    queryFn: async () => {
      const initial = await fetchGuildFeed(nostr);
      return initial;
    },
    enabled: args.enabled,
    staleTime: Infinity,
  });

  const feed = feedQuery.data ?? { guilds: [DEFAULT_GUILD], membersBySlug: {} };

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: GUILD_FEED_KEY });
  }, [queryClient]);

  const setMembership = useCallback(
    (next: GuildMembership | null) => {
      args.setQuestState((prev) => {
        const state = { ...prev, guildMembership: next };
        window.queueMicrotask(() => void args.persistQuestCheckpoint(state));
        return state;
      });
    },
    [args]
  );

  const joinGuild = useMutation({
    mutationFn: async (guild: GuildDefinitionView) => {
      if (!args.myPubkey) throw new Error('You must be logged in to join a guild.');
      if (hasActiveMembership) throw new Error('Leave your current guild first.');

      const playerName = args.questState.playerName.trim() || 'Stranger';
      const existing = feed.membersBySlug[guild.slug] ?? [];
      const alreadyActive = existing.some((m) => m.pubkey === args.myPubkey && isActiveMember(m));
      if (alreadyActive) throw new Error('You are already a member of this guild.');

      const joinedAtSec = Math.floor(Date.now() / 1000);
      await publish(
        buildMembershipDraft({
          guildSlug: guild.slug,
          playerName,
          joinedAtSec,
          status: 'active',
        })
      );

      setMembership({
        guildSlug: guild.slug,
        guildName: guild.name,
        joinedAtMs: joinedAtSec * 1000,
      });
      return guild;
    },
    onSuccess: () => invalidateFeed(),
  });

  const leaveGuild = useMutation({
    mutationFn: async () => {
      if (!args.myPubkey || !membership) throw new Error('You are not in a guild.');
      const playerName = args.questState.playerName.trim() || 'Stranger';
      const leftAtSec = Math.floor(Date.now() / 1000);

      await publish(
        buildMembershipDraft({
          guildSlug: membership.guildSlug,
          playerName,
          joinedAtSec: Math.floor(membership.joinedAtMs / 1000),
          status: 'left',
          leftAtSec,
        })
      );

      setMembership({
        ...membership,
        leftAtMs: leftAtSec * 1000,
      });
    },
    onSuccess: () => invalidateFeed(),
  });

  const createGuild = useMutation({
    mutationFn: async (guildName: string) => {
      if (!args.myPubkey) throw new Error('You must be logged in to create a guild.');
      const trimmed = guildName.trim();
      if (!trimmed) throw new Error('Enter a guild name.');
      if (!hasAtLeastGold(args.questState.modifiers, GUILD_CREATE_COST_GOLD)) {
        throw new Error(`You need at least ${GUILD_CREATE_COST_GOLD} gold to create a guild.`);
      }
      if (hasActiveMembership) throw new Error('Leave your current guild first.');

      const latest = await fetchGuildFeed(nostr);
      const existingSlugs = new Set(latest.guilds.map((g) => g.slug));
      const slug = resolveUniqueGuildSlug(trimmed, existingSlugs);
      const leaderName = args.questState.playerName.trim() || 'Stranger';
      const joinedAtSec = Math.floor(Date.now() / 1000);

      await publish(
        buildGuildDefDraft({
          slug,
          name: trimmed,
          leaderName,
        })
      );

      args.onApplyModifiers(GUILD_CREATE_GOLD_DELTA);

      await publish(
        buildMembershipDraft({
          guildSlug: slug,
          playerName: leaderName,
          joinedAtSec,
          status: 'active',
        })
      );

      setMembership({
        guildSlug: slug,
        guildName: trimmed,
        joinedAtMs: joinedAtSec * 1000,
      });

      return { slug, name: trimmed };
    },
    onSuccess: () => invalidateFeed(),
  });

  const myActiveMembershipSlug = useMemo(() => {
    if (!args.myPubkey) return null;
    if (hasActiveMembership) return membership!.guildSlug;
    for (const [slug, rows] of Object.entries(feed.membersBySlug)) {
      if (rows.some((m) => m.pubkey === args.myPubkey && isActiveMember(m))) return slug;
    }
    return null;
  }, [args.myPubkey, feed.membersBySlug, hasActiveMembership, membership]);

  const canAffordCreate = hasAtLeastGold(args.questState.modifiers, GUILD_CREATE_COST_GOLD);

  return {
    feedQuery,
    feed,
    membership,
    hasActiveMembership,
    myActiveMembershipSlug,
    canAffordCreate,
    joinGuild,
    leaveGuild,
    createGuild,
    invalidateFeed,
  };
}
