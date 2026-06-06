import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { probeAllGameRelays } from '@/lib/probeGameRelay';

const GAME_RELAY_HEALTH_KEY = ['game-relay-health'] as const;

/** Manual probe only — call `refetch()` from the dev overlay Probe button. */
export function useGameRelayHealth() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: GAME_RELAY_HEALTH_KEY,
    queryFn: () => probeAllGameRelays(nostr),
    enabled: false,
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
