import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  computeGameDayCounterFromCreationYmd,
  computeNextGameResetUtcFromCreationYmd,
  EASTERN_GAME_TIMEZONE,
} from '@/lib/easternGameTime';
import {
  fetchCharacterCreationDateFromRelay,
  repairCharacterCreationOnRelay,
} from '../gameProfile';
import {
  CHARACTER_CREATION_DATE_STORAGE_KEY,
  CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY,
  CHARACTER_START_TS_STORAGE_KEY,
  DAY_IN_MS,
  DEV_DAY_OFFSET_STORAGE_KEY,
  DEV_FIVE_MINUTE_DAYS_STORAGE_KEY,
  DEV_RAPID_DAY_SIM_INTERVAL_MS,
  DEV_RAPID_DAY_SIM_STORAGE_KEY,
} from '../constants';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export type UseDayCounterArgs = {
  /** From hydrated quest state — merged with relay + localStorage for creation Eastern date. */
  questCreationDateEastern: string | null;
};

export function useDayCounter({ questCreationDateEastern }: UseDayCounterArgs) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [devFiveMinuteDays, setDevFiveMinuteDays] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(DEV_FIVE_MINUTE_DAYS_STORAGE_KEY);
    if (raw === '1') setDevFiveMinuteDays(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(DEV_FIVE_MINUTE_DAYS_STORAGE_KEY, devFiveMinuteDays ? '1' : '0');
  }, [devFiveMinuteDays]);

  const useFiveMinuteTestPeriods = Boolean(import.meta.env.DEV && devFiveMinuteDays);

  const [creationDateEastern, setCreationDateEastern] = useState<string | null>(null);
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

    const resolveLocalCreationDate = (): string | null => {
      const fromLs = localStorage.getItem(CHARACTER_CREATION_DATE_STORAGE_KEY);
      if (fromLs && YMD_RE.test(fromLs)) return fromLs;
      const legacyRaw = localStorage.getItem(CHARACTER_START_TS_STORAGE_KEY);
      if (legacyRaw) {
        const n = Number(legacyRaw);
        if (!Number.isNaN(n) && n > 0) {
          return formatInTimeZone(n, EASTERN_GAME_TIMEZONE, 'yyyy-MM-dd');
        }
      }
      return null;
    };

    const load = async () => {
      let relayDate: string | null = null;
      try {
        if (user) {
          relayDate = await fetchCharacterCreationDateFromRelay(nostr, user.pubkey);
        }
      } catch (error) {
        console.warn('Failed to load character creation from Nostr.', error);
      }
      if (cancelled) return;

      const localDate = resolveLocalCreationDate();
      const fromQuest = questCreationDateEastern;

      const resetPending =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem(CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY) === '1';

      let relayPart = relayDate;
      if (resetPending && !fromQuest) {
        relayPart = null;
      }

      const merged = fromQuest ?? relayPart ?? localDate ?? null;

      if (fromQuest) {
        localStorage.removeItem(CHARACTER_CREATION_RESET_PENDING_STORAGE_KEY);
      }

      if (merged) {
        localStorage.setItem(CHARACTER_CREATION_DATE_STORAGE_KEY, merged);
      }

      if (!relayDate && fromQuest && user?.signer && YMD_RE.test(fromQuest)) {
        try {
          await repairCharacterCreationOnRelay(nostr, user.signer, fromQuest);
        } catch (error) {
          console.warn('Failed to repair character creation on relay.', error);
        }
      }

      if (cancelled) return;
      setCreationDateEastern(merged);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [nostr, questCreationDateEastern, user]);

  const effectiveNow = Date.now() + devDayOffsetMs;
  const dayCounter = computeGameDayCounterFromCreationYmd(
    creationDateEastern,
    effectiveNow,
    useFiveMinuteTestPeriods
  );

  const nextDayResetUtc = computeNextGameResetUtcFromCreationYmd(
    creationDateEastern,
    effectiveNow,
    useFiveMinuteTestPeriods
  );
  const nextDayResetMs =
    nextDayResetUtc !== null ? nextDayResetUtc - devDayOffsetMs : null;

  /** Clears local creation cache only — quest reset clears canonical state via `resetQuestStateAndSync`. */
  const resetTimestamp = async () => {
    setCreationDateEastern(null);
    localStorage.removeItem(CHARACTER_CREATION_DATE_STORAGE_KEY);
    localStorage.removeItem(CHARACTER_START_TS_STORAGE_KEY);
  };

  return {
    creationDateEastern,
    dayCounter,
    useFiveMinuteTestPeriods,
    devFiveMinuteDays,
    setDevFiveMinuteDays,
    devDayOffsetMs,
    setDevDayOffsetMs,
    resetTimestamp,
    nextDayResetMs,
    rapidDaySimulation,
    setRapidDaySimulation,
  };
}
