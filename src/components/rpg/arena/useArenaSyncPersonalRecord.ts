import { useEffect, useRef } from 'react';
import type { ArenaMatchResult } from './arenaNostr';
import { mergeArenaMatchesIntoQuestState } from './arenaRecord';
import type { QuestState } from '../quests/types';

/** Merges new relay match rows into quest state (idempotent by match event id). */
export function useArenaSyncPersonalRecord(args: {
  matches: readonly ArenaMatchResult[];
  myPubkey: string | undefined;
  enabled: boolean;
  setQuestState: React.Dispatch<React.SetStateAction<QuestState>>;
  persistQuestCheckpoint: (state: QuestState) => void | Promise<void>;
}) {
  const { matches, myPubkey, enabled, setQuestState, persistQuestCheckpoint } = args;
  const mergedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !myPubkey || matches.length === 0) return;

    const fresh = matches.filter((m) => !mergedIdsRef.current.has(m.eventId));
    if (fresh.length === 0) return;

    const involvesMe = fresh.some(
      (m) => m.fighterA.pubkey === myPubkey || m.fighterB.pubkey === myPubkey
    );
    if (!involvesMe) return;

    setQuestState((prev) => {
      const next = mergeArenaMatchesIntoQuestState(prev, fresh, myPubkey);
      if (next === prev) return prev;
      for (const m of fresh) mergedIdsRef.current.add(m.eventId);
      void persistQuestCheckpoint(next);
      return next;
    });
  }, [enabled, matches, myPubkey, setQuestState, persistQuestCheckpoint]);
}
