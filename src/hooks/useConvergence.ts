import { useMemo } from 'react';
import type { NetworkPresenceMember } from '@/lib/rpg/utils';

export interface ConvergenceSignal {
  pubkey: string;
  characterName: string;
  classLabel: string;
}

export function useConvergence(
  myClassLabel: string | undefined,
  networkMembers: NetworkPresenceMember[] | undefined,
) {
  return useMemo(() => {
    if (!myClassLabel) return { matches: [] as ConvergenceSignal[] };
    const matches = (networkMembers ?? [])
      .filter((member) => member.classLabel === myClassLabel)
      .map((member) => ({
        pubkey: member.pubkey,
        characterName: member.characterName,
        classLabel: member.classLabel,
      }));
    return { matches };
  }, [myClassLabel, networkMembers]);
}
