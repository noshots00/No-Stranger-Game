import { useRef } from 'react';
import { getNpcPortraitSrc } from '@/components/rpg/rpgArtAssignments';
import { PLACEHOLDER_MAYOR_NAME } from './constants';
import { buildMayorElectionSnapshot } from './mayorElectionNostr';
import { useMayorElectionQuery } from './useMayorElectionQuery';

const MAYOR_PORTRAIT_SRC = getNpcPortraitSrc('shannon');

export function useVillageMayorIdentity(args: { enabled: boolean }) {
  const electionQuery = useMayorElectionQuery({
    enabled: args.enabled,
    refetchOnMount: 'always',
  });

  const snapshot = electionQuery.data ?? buildMayorElectionSnapshot([], []);
  const frozenMayorNameRef = useRef<string | null>(null);
  const frozenIsPlaceholderRef = useRef<boolean | null>(null);

  if (electionQuery.isSuccess && frozenMayorNameRef.current === null) {
    frozenMayorNameRef.current = snapshot.mayorName;
    frozenIsPlaceholderRef.current = snapshot.isPlaceholderMayor;
  }

  const mayorName = frozenMayorNameRef.current ?? PLACEHOLDER_MAYOR_NAME;
  const isPlaceholderMayor =
    frozenIsPlaceholderRef.current ?? snapshot.isPlaceholderMayor;

  return {
    mayorName,
    portraitSrc: MAYOR_PORTRAIT_SRC,
    isPlaceholderMayor,
    isLoading: electionQuery.isLoading && !electionQuery.isFetched,
  };
}
