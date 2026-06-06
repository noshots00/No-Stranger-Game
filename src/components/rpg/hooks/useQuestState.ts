import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  createInitialQuestState,
  getCompletedQuestIds,
  hydrateQuestStateFromSources,
  normalizeQuestState,
  reconcileVillagePhaseState,
} from '../quests/engine';
import {
  canPersistQuestCheckpoint,
  wouldClobberEstablishedLocalSave,
} from '../quests/questSaveGuard';
import { fetchQuestStateSnapshot, publishQuestStateSnapshot } from '../gameProfile';
import { QUEST_STATE_STORAGE_KEY } from '../constants';
import type { QuestState } from '../quests/types';

/** Coalesce rapid setState bursts (catch-up effects) into one relay write. */
const RELAY_CHECKPOINT_DEBOUNCE_MS = 750;

export function useQuestState() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [questState, setQuestState] = useState(createInitialQuestState);
  const [isQuestStateHydrated, setIsQuestStateHydrated] = useState(false);
  const questStateRef = useRef(questState);
  questStateRef.current = questState;
  const relayPublishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questStateStorageKey = user ? `${QUEST_STATE_STORAGE_KEY}:${user.pubkey}` : QUEST_STATE_STORAGE_KEY;

  const cancelScheduledRelayPublish = useCallback(() => {
    if (relayPublishTimerRef.current) {
      clearTimeout(relayPublishTimerRef.current);
      relayPublishTimerRef.current = null;
    }
  }, []);

  const publishRelayCheckpointNow = useCallback(
    async (state: QuestState) => {
      if (!user?.signer || !canPersistQuestCheckpoint(state)) return;
      try {
        await publishQuestStateSnapshot(nostr, user.signer, state);
      } catch (error) {
        console.warn('Failed to publish quest checkpoint to Nostr.', error);
      }
    },
    [nostr, user]
  );

  const scheduleRelayPublish = useCallback(
    (state: QuestState) => {
      if (!user?.signer || !canPersistQuestCheckpoint(state)) return;
      cancelScheduledRelayPublish();
      relayPublishTimerRef.current = setTimeout(() => {
        relayPublishTimerRef.current = null;
        void publishRelayCheckpointNow(questStateRef.current);
      }, RELAY_CHECKPOINT_DEBOUNCE_MS);
    },
    [user, cancelScheduledRelayPublish, publishRelayCheckpointNow]
  );

  const writeLocalCheckpoint = useCallback(
    (state: QuestState): boolean => {
      if (!canPersistQuestCheckpoint(state)) return false;
      if (wouldClobberEstablishedLocalSave(questStateStorageKey, state)) {
        console.warn('Skipped persisting blank quest state over an established local save.');
        return false;
      }
      const nextRaw = JSON.stringify(state);
      if (localStorage.getItem(questStateStorageKey) === nextRaw) return false;
      localStorage.setItem(questStateStorageKey, nextRaw);
      return true;
    },
    [questStateStorageKey]
  );

  // When the account changes, reset in-memory state and block persist *before* the next
  // useEffect pass. Otherwise the persist effect can run with the new storage key but the
  // *previous* user's questState and isQuestStateHydrated === true, clobbering the new
  // account's localStorage (and the UI) with the old character.
  useLayoutEffect(() => {
    cancelScheduledRelayPublish();
    setIsQuestStateHydrated(false);
    setQuestState(createInitialQuestState());
  }, [questStateStorageKey, cancelScheduledRelayPublish]);

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

        if (user?.signer && relayState && localState && canPersistQuestCheckpoint(merged)) {
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

  /** After naming: every questState change writes local + schedules kind 10032 on relays. */
  useEffect(() => {
    if (!isQuestStateHydrated) return;
    if (!writeLocalCheckpoint(questState)) return;
    scheduleRelayPublish(questState);
    return cancelScheduledRelayPublish;
  }, [
    isQuestStateHydrated,
    questState,
    writeLocalCheckpoint,
    scheduleRelayPublish,
    cancelScheduledRelayPublish,
  ]);

  const persistQuestCheckpoint = useCallback(
    async (state: QuestState) => {
      if (!writeLocalCheckpoint(state)) return;
      cancelScheduledRelayPublish();
      await publishRelayCheckpointNow(state);
    },
    [writeLocalCheckpoint, cancelScheduledRelayPublish, publishRelayCheckpointNow]
  );

  const resetQuestStateAndSync = useCallback(async () => {
    cancelScheduledRelayPublish();
    const initial = createInitialQuestState();
    setQuestState(initial);
    localStorage.setItem(questStateStorageKey, JSON.stringify(initial));
    if (!user?.signer) return;
    try {
      await publishQuestStateSnapshot(nostr, user.signer, initial);
    } catch (error) {
      console.warn('Failed to publish reset quest checkpoint; story may revert after reload.', error);
    }
  }, [nostr, questStateStorageKey, user, cancelScheduledRelayPublish]);

  /** Dev: restore a historical kind 10032 row; re-publish when named so it becomes newest on relays. */
  const restoreQuestCheckpoint = useCallback(
    async (state: QuestState) => {
      cancelScheduledRelayPublish();
      const normalized = reconcileVillagePhaseState(normalizeQuestState(state));
      setQuestState(normalized);
      localStorage.setItem(questStateStorageKey, JSON.stringify(normalized));
      if (!user?.signer || !canPersistQuestCheckpoint(normalized)) return;
      try {
        await publishQuestStateSnapshot(nostr, user.signer, normalized);
      } catch (error) {
        console.warn('Failed to publish restored quest checkpoint to Nostr.', error);
        throw error;
      }
    },
    [nostr, questStateStorageKey, user, cancelScheduledRelayPublish]
  );

  const getQuestState = useCallback(() => questStateRef.current, []);

  return {
    questState,
    getQuestState,
    setQuestState,
    isQuestStateHydrated,
    persistQuestCheckpoint,
    resetQuestStateAndSync,
    restoreQuestCheckpoint,
  };
}
