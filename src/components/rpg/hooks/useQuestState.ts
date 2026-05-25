import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  createInitialQuestState,
  getCompletedQuestIds,
  hydrateQuestStateFromSources,
  normalizeQuestState,
} from '../quests/engine';
import { fetchQuestStateSnapshot, publishQuestStateSnapshot } from '../gameProfile';
import { QUEST_STATE_STORAGE_KEY } from '../constants';
import type { QuestState } from '../quests/types';

export function useQuestState() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [questState, setQuestState] = useState(createInitialQuestState);
  const [isQuestStateHydrated, setIsQuestStateHydrated] = useState(false);

  const questStateStorageKey = user ? `${QUEST_STATE_STORAGE_KEY}:${user.pubkey}` : QUEST_STATE_STORAGE_KEY;

  // When the account changes, reset in-memory state and block persist *before* the next
  // useEffect pass. Otherwise the persist effect can run with the new storage key but the
  // *previous* user's questState and isQuestStateHydrated === true, clobbering the new
  // account's localStorage (and the UI) with the old character.
  useLayoutEffect(() => {
    setIsQuestStateHydrated(false);
    setQuestState(createInitialQuestState());
  }, [questStateStorageKey]);

  useEffect(() => {
    let cancelled = false;
    setIsQuestStateHydrated(false);

    const loadQuestState = async () => {
      let relayState: QuestState | null = null;
      if (user) {
        try {
          const snapshot = await fetchQuestStateSnapshot(nostr, user.pubkey);
          if (snapshot?.state) {
            relayState = normalizeQuestState(snapshot.state);
          }
        } catch (error) {
          console.warn('Failed to load quest checkpoint from Nostr, using local fallback.', error);
        }
      }

      let localState: QuestState | null = null;
      try {
        const raw = localStorage.getItem(questStateStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            localState = normalizeQuestState(parsed as Partial<QuestState>);
          }
        }
      } catch {
        localState = null;
      }

      if (!cancelled) {
        const merged = hydrateQuestStateFromSources(relayState, localState);
        setQuestState(merged);
        setIsQuestStateHydrated(true);

        if (user?.signer && relayState && localState) {
          const relayDone = getCompletedQuestIds(relayState).length;
          const mergedDone = getCompletedQuestIds(merged).length;
          if (mergedDone > relayDone) {
            void publishQuestStateSnapshot(nostr, user.signer, merged).catch((error) => {
              console.warn('Failed to sync merged quest checkpoint to Nostr.', error);
            });
          }
        }
      }
    };

    void loadQuestState();

    return () => {
      cancelled = true;
    };
  }, [nostr, questStateStorageKey, user]);

  useEffect(() => {
    if (!isQuestStateHydrated) return;
    localStorage.setItem(questStateStorageKey, JSON.stringify(questState));
  }, [isQuestStateHydrated, questState, questStateStorageKey]);

  const persistQuestCheckpoint = useCallback(
    async (state: QuestState) => {
      localStorage.setItem(questStateStorageKey, JSON.stringify(state));
      if (!user) return;
      try {
        await publishQuestStateSnapshot(nostr, user.signer, state);
      } catch (error) {
        console.warn('Failed to publish quest checkpoint to Nostr.', error);
      }
    },
    [nostr, questStateStorageKey, user]
  );

  const resetQuestStateAndSync = useCallback(async () => {
    const initial = createInitialQuestState();
    setQuestState(initial);
    localStorage.setItem(questStateStorageKey, JSON.stringify(initial));
    if (!user?.signer) return;
    try {
      await publishQuestStateSnapshot(nostr, user.signer, initial);
    } catch (error) {
      console.warn('Failed to publish reset quest checkpoint; story may revert after reload.', error);
    }
  }, [nostr, questStateStorageKey, user]);

  return {
    questState,
    setQuestState,
    isQuestStateHydrated,
    persistQuestCheckpoint,
    resetQuestStateAndSync,
  };
}
