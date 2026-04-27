import { useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';

export interface RelayRegion {
  relay: string;
  region: string;
}

const regionForRelay = (relay: string): string => {
  const host = relay.toLowerCase();
  if (host.includes('damus')) return 'The Western Reaches';
  if (host.includes('primal')) return 'The Golden Estuary';
  if (host.includes('ditto')) return 'The Pale Archive';
  if (host.includes('nos.lol')) return 'The Glass Coast';
  return 'The Uncharted Relaylands';
};

export function useRelayRegions() {
  const { config } = useAppContext();
  return useMemo<RelayRegion[]>(
    () => config.relayMetadata.relays
      .filter((relay) => relay.read || relay.write)
      .map((relay) => ({ relay: relay.url, region: regionForRelay(relay.url) })),
    [config.relayMetadata.relays],
  );
}
