import { useEffect, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { fetchOrCreateCharacterStartTimestamp, publishCharacterStartTimestamp } from '../gameProfile';
import {
  CHARACTER_START_TS_STORAGE_KEY,
  DAY_IN_MS,
  DEV_DAY_OFFSET_STORAGE_KEY,
  DEV_RAPID_DAY_SIM_INTERVAL_MS,
  DEV_RAPID_DAY_SIM_STORAGE_KEY,
} from '../constants';

export function useDayCounter() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [characterStartTimestamp, setCharacterStartTimestamp] = useState<number | null>(null);
  const [devDayOffsetMs, setDevDayOffsetMs] = useState(0);
  const [rapidDaySimulation, setRapidDaySimulation] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(DEV_RAPID_DAY_SIM_STORAGE_KEY);
    if (raw === '1') setRapidDaySimulation(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_RAPID_DAY_SIM_STORAGE_KEY, rapidDaySimulation ? '1' : '0');
  }, [rapidDaySimulation]);

  useEffect(() => {
    if (!rapidDaySimulation) return;
    const id = window.setInterval(() => {
      setDevDayOffsetMs((prev) => prev + DAY_IN_MS);
    }, DEV_RAPID_DAY_SIM_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [rapidDaySimulation]);

  useEffect(() => {
    const raw = localStorage.getItem(DEV_DAY_OFFSET_STORAGE_KEY);
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      setDevDayOffsetMs(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_DAY_OFFSET_STORAGE_KEY, String(devDayOffsetMs));
  }, [devDayOffsetMs]);

  useEffect(() => {
    let cancelled = false;

    const loadStartTimestamp = async () => {
      try {
        if (user) {
          const startTimestamp = await fetchOrCreateCharacterStartTimestamp(nostr, user.pubkey, user.signer);
          if (!cancelled) {
            setCharacterStartTimestamp(startTimestamp);
            localStorage.setItem(CHARACTER_START_TS_STORAGE_KEY, String(startTimestamp));
          }
          return;
        }
      } catch (error) {
        console.warn('Failed to load Nostr start timestamp, using local fallback.', error);
      }

      const localRaw = localStorage.getItem(CHARACTER_START_TS_STORAGE_KEY);
      if (localRaw) {
        const parsed = Number(localRaw);
        if (!Number.isNaN(parsed)) {
          if (!cancelled) setCharacterStartTimestamp(parsed);
          return;
        }
      }

      const fallback = Date.now();
      localStorage.setItem(CHARACTER_START_TS_STORAGE_KEY, String(fallback));
      if (!cancelled) setCharacterStartTimestamp(fallback);
    };

    void loadStartTimestamp();

    return () => {
      cancelled = true;
    };
  }, [nostr, user]);

  const effectiveNow = Date.now() + devDayOffsetMs;
  const dayCounter = (() => {
    if (!characterStartTimestamp) return 1;
    const elapsed = Math.max(0, effectiveNow - characterStartTimestamp);
    return Math.max(1, Math.floor(elapsed / DAY_IN_MS) + 1);
  })();

  /** Wall-clock ms when the next in-game day rolls over (null until start ts is loaded). */
  const nextDayResetMs = characterStartTimestamp
    ? characterStartTimestamp + dayCounter * DAY_IN_MS - devDayOffsetMs
    : null;

  const resetTimestamp = async () => {
    const now = Date.now();
    setCharacterStartTimestamp(now);
    localStorage.setItem(CHARACTER_START_TS_STORAGE_KEY, String(now));
    if (user?.signer) {
      try {
        await publishCharacterStartTimestamp(nostr, user.signer, now);
      } catch (error) {
        console.warn('Failed to publish reset character start timestamp; day may revert after reload.', error);
      }
    }
  };

  return {
    dayCounter,
    devDayOffsetMs,
    setDevDayOffsetMs,
    resetTimestamp,
    nextDayResetMs,
    rapidDaySimulation,
    setRapidDaySimulation,
  };
}
