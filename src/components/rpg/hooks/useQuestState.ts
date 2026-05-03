import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createInitialQuestState, normalizeQuestState } from '../quests/engine';
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
      if (user) {
        try {
          const snapshot = await fetchQuestStateSnapshot(nostr, user.pubkey);
          if (!cancelled && snapshot?.state) {
            setQuestState(normalizeQuestState(snapshot.state));
            setIsQuestStateHydrated(true);
            return;
          }
        } catch (error) {
          console.warn('Failed to load quest checkpoint from Nostr, using local fallback.', error);
        }
      }

      try {
        const raw = localStorage.getItem(questStateStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (!cancelled) {
              setQuestState(normalizeQuestState(parsed as Partial<QuestState>));
              setIsQuestStateHydrated(true);
            }
            return;
          }
        }
      } catch {
        setQuestState(createInitialQuestState());
      }

      if (!cancelled) {
        setQuestState(createInitialQuestState());
        setIsQuestStateHydrated(true);
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
