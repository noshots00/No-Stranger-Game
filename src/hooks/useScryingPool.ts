import { useMemo } from 'react';
import type { NetworkPresenceMember } from '@/lib/rpg/utils';

export interface ScryingGlimmer {
  locationId: string;
  seenByCount: number;
  sourcePubkeys: string[];
}

export function useScryingPool(
  myLocations: string[] | undefined,
  networkMembers: NetworkPresenceMember[] | undefined,
) {
  return useMemo(() => {
    const mySet = new Set(myLocations ?? []);
    const counts = new Map<string, { count: number; pubkeys: string[] }>();

    for (const member of networkMembers ?? []) {
      for (const location of member.discoveredLocations ?? []) {
        if (mySet.has(location)) continue;
        const existing = counts.get(location);
        if (existing) {
          existing.count += 1;
          if (!existing.pubkeys.includes(member.pubkey)) existing.pubkeys.push(member.pubkey);
          continue;
        }
        counts.set(location, { count: 1, pubkeys: [member.pubkey] });
      }
    }

    const glimmers: ScryingGlimmer[] = [...counts.entries()]
      .map(([locationId, data]) => ({
        locationId,
        seenByCount: data.count,
        sourcePubkeys: data.pubkeys,
      }))
      .sort((a, b) => b.seenByCount - a.seenByCount);

    return { glimmers };
  }, [myLocations, networkMembers]);
}
