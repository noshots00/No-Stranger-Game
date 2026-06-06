import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { probeAllGameRelays } from '@/lib/probeGameRelay';

const GAME_RELAY_HEALTH_KEY = ['game-relay-health'] as const;
const RELAY_HEALTH_POLL_MS = 30_000;

export function useGameRelayHealth(enabled: boolean) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: GAME_RELAY_HEALTH_KEY,
    queryFn: () => probeAllGameRelays(nostr),
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? RELAY_HEALTH_POLL_MS : false,
  });
}
