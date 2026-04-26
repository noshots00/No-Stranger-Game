import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrMetadata } from '@nostrify/nostrify';
import { getDisplayNameForPubkey, mergeUniquePubkeys, type NetworkPresenceMember } from '@/lib/rpg/utils';

const NETWORK_SIZE_LIMIT = 500;
const DISPLAY_NAMES_LIMIT = 5;
export const PRESENCE_RELAYS = ['wss://relay.ditto.pub', 'wss://relay.primal.net'] as const;

interface NetworkPresenceData {
  totalOptedIn: number;
  topMembers: NetworkPresenceMember[];
  diagnostics: {
    followsCount: number;
    followersCount: number;
    networkCount: number;
    optedInCount: number;
    selfPresenceLive: boolean;
    relays: readonly string[];
  };
}

const getMetadataMap = (metadataEvents: Array<{ pubkey: string; content: string }>): Map<string, NostrMetadata> => {
  const map = new Map<string, NostrMetadata>();

  for (const event of metadataEvents) {
    if (map.has(event.pubkey)) continue;
    try {
      map.set(event.pubkey, JSON.parse(event.content) as NostrMetadata);
    } catch {
      // Ignore invalid metadata payloads.
    }
  }

  return map;
};

export function useNetworkPresence(userPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<NetworkPresenceData>({
    queryKey: ['nostr', 'network-presence', userPubkey ?? ''],
    enabled: Boolean(userPubkey),
    staleTime: 10_000,
    refetchInterval: 15_000,
    queryFn: async () => {
      const presenceNostr = nostr.group([...PRESENCE_RELAYS]);

      if (!userPubkey) {
        return {
          totalOptedIn: 0,
          topMembers: [],
          diagnostics: {
            followsCount: 0,
            followersCount: 0,
            networkCount: 0,
            optedInCount: 0,
            selfPresenceLive: false,
            relays: PRESENCE_RELAYS,
          },
        };
      }

      const contactEvents = await presenceNostr.query(
        [{ kinds: [3], authors: [userPubkey], limit: 1 }],
        { signal: AbortSignal.timeout(5000) },
      );

      const follows: string[] = contactEvents[0]?.tags
        .filter(([tag]) => tag === 'p')
        .map(([, pubkey]) => pubkey) ?? [];

      const followerEvents = await presenceNostr.query(
        [{ kinds: [3], '#p': [userPubkey], limit: NETWORK_SIZE_LIMIT }],
        { signal: AbortSignal.timeout(5000) },
      );
      const followers: string[] = followerEvents.map((event) => event.pubkey);

      const networkPubkeys = mergeUniquePubkeys(follows, followers, userPubkey).slice(0, NETWORK_SIZE_LIMIT);

      const selfPresenceEvents = await presenceNostr.query(
        [
          { kinds: [3223], authors: [userPubkey], limit: 1 },
          { kinds: [30000], authors: [userPubkey], '#d': ['opt-in'], limit: 1 },
        ],
        { signal: AbortSignal.timeout(5000) },
      );
      const selfPresenceLive = selfPresenceEvents.length > 0;

      if (networkPubkeys.length === 0) {
        return {
          totalOptedIn: 0,
          topMembers: [],
          diagnostics: {
            followsCount: follows.length,
            followersCount: followers.length,
            networkCount: 0,
            optedInCount: 0,
            selfPresenceLive,
            relays: PRESENCE_RELAYS,
          },
        };
      }

      const presenceEvents = await presenceNostr.query(
        [
          { kinds: [3223], authors: networkPubkeys, limit: NETWORK_SIZE_LIMIT },
          { kinds: [30000], authors: networkPubkeys, '#d': ['opt-in'], limit: NETWORK_SIZE_LIMIT },
        ],
        { signal: AbortSignal.timeout(6000) },
      );

      const optedInCandidates = presenceEvents
        .filter((event) => event.kind !== 30000 || event.tags.some(([name, value]) => name === 'd' && value === 'opt-in'))
        .map((event) => String(event.pubkey));
      const optedInPubkeys = Array.from(new Set<string>(optedInCandidates));

      if (optedInPubkeys.length === 0) {
        return {
          totalOptedIn: 0,
          topMembers: [],
          diagnostics: {
            followsCount: follows.length,
            followersCount: followers.length,
            networkCount: networkPubkeys.length,
            optedInCount: 0,
            selfPresenceLive,
            relays: PRESENCE_RELAYS,
          },
        };
      }

      const metadataEvents = await presenceNostr.query(
        [{ kinds: [0], authors: optedInPubkeys, limit: NETWORK_SIZE_LIMIT }],
        { signal: AbortSignal.timeout(5000) },
      );

      const metadataMap = getMetadataMap(
        metadataEvents.map((event) => ({
          pubkey: event.pubkey,
          content: event.content,
        })),
      );
      const topMembers: NetworkPresenceMember[] = optedInPubkeys
        .slice(0, DISPLAY_NAMES_LIMIT)
        .map((pubkey) => ({
          pubkey,
          displayName: getDisplayNameForPubkey(pubkey, metadataMap.get(pubkey)),
        }));

      return {
        totalOptedIn: optedInPubkeys.length,
        topMembers,
        diagnostics: {
          followsCount: follows.length,
          followersCount: followers.length,
          networkCount: networkPubkeys.length,
          optedInCount: optedInPubkeys.length,
          selfPresenceLive,
          relays: PRESENCE_RELAYS,
        },
      };
    },
  });
}

