import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { QuestState } from '../quests/types';
import { buildFighterFromEncounter, buildFighterFromQuestState } from './buildFighter';
import { getCombatEncounter, type CombatEncounterId } from './combatEncounters';
import { type CombatLogLine, nextCombatLogId } from './combatLog';
import type { CombatLogEntry } from './combatTypes';
import { generateCombatSeed } from './combatRng';
import { getPlayerMaxHp } from './playerHealth';
import { createCombatRuntime, runSingleRound } from './runCombat';
import type { CombatRuntimeState } from './combatTypes';

export type CombatPhase = 'talk' | 'entering' | 'combat' | 'ended';

const ENTER_DELAY_MS = 400;
const ROUND_DELAY_MS = 2000;
const VICTORY_RETURN_MS = 1200;

type UseCombatEncounterOptions = {
  encounterId: CombatEncounterId;
  questState: QuestState;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onVictory?: () => void;
};

function logEntryToLine(entry: CombatLogEntry, playerIsA: boolean): CombatLogLine {
  const tone: CombatLogLine['tone'] =
    entry.side === 'narrator'
      ? 'narrator'
      : (entry.side === 'a') === playerIsA
        ? 'player'
        : 'enemy';
  return {
    id: nextCombatLogId(),
    text: entry.text,
    tone,
    detail: entry.detail,
  };
}

export function useCombatEncounter({
  encounterId,
  questState,
  onPlayerHealthChange,
  onCombatChromeChange,
  onVictory,
}: UseCombatEncounterOptions) {
  const def = getCombatEncounter(encounterId);
  const [phase, setPhase] = useState<CombatPhase>('talk');
  const [combatLog, setCombatLog] = useState<CombatLogLine[]>([]);
  const [enemyHp, setEnemyHp] = useState(def.fighter.maxHp ?? 0);
  const [playerHp, setPlayerHp] = useState(questState.health);
  const [playerMaxHp, setPlayerMaxHp] = useState(getPlayerMaxHp(questState));
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const endingRef = useRef(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runtimeRef = useRef<CombatRuntimeState | null>(null);
  const seedRef = useRef('');
  const onPlayerHealthChangeRef = useRef(onPlayerHealthChange);
  const onCombatChromeChangeRef = useRef(onCombatChromeChange);
  const onVictoryRef = useRef(onVictory);

  onPlayerHealthChangeRef.current = onPlayerHealthChange;
  onCombatChromeChangeRef.current = onCombatChromeChange;
  onVictoryRef.current = onVictory;

  const enemyMaxHp = def.fighter.maxHp ?? def.fighter.stats.con * 10 + def.fighter.level + 10;

  const syncHpFromRuntime = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt) return;
    const pHp = rt.fighterA.hp;
    const eHp = rt.fighterB.hp;
    setPlayerHp(pHp);
    setEnemyHp(eHp);
    onPlayerHealthChangeRef.current?.(pHp);
  }, []);

  const finishCombat = useCallback(() => {
    endingRef.current = false;
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    runtimeRef.current = null;
    setPhase('talk');
    setCombatLog([]);
    setEnemyHp(enemyMaxHp);
    setPlayerHp(questState.health);
    setPlayerMaxHp(getPlayerMaxHp(questState));
    onCombatChromeChangeRef.current?.(false);
  }, [enemyMaxHp, questState.health]);

  const scheduleVictoryReturn = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    window.setTimeout(() => onVictoryRef.current?.(), 0);
    setCombatLog((prev) => [
      ...prev,
      ...def.victoryLines.map((text) => ({
        id: nextCombatLogId(),
        text,
        tone: 'enemy' as const,
      })),
    ]);
    window.setTimeout(() => finishCombat(), VICTORY_RETURN_MS);
  }, [def.victoryLines, finishCombat]);

  const scheduleDefeatReturn = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    syncHpFromRuntime();
    setCombatLog((prev) => [
      ...prev,
      ...def.defeatLines.map((text) => ({
        id: nextCombatLogId(),
        text,
        tone: 'narrator' as const,
      })),
    ]);
    window.setTimeout(() => finishCombat(), VICTORY_RETURN_MS);
  }, [def.defeatLines, finishCombat, syncHpFromRuntime]);

  const checkEnd = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt || !rt.over) return false;
    syncHpFromRuntime();
    if (rt.winnerId === rt.fighterA.id) {
      scheduleVictoryReturn();
      return true;
    }
    if (rt.winnerId === rt.fighterB.id) {
      scheduleDefeatReturn();
      return true;
    }
    return false;
  }, [scheduleDefeatReturn, scheduleVictoryReturn, syncHpFromRuntime]);

  const advanceRound = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt || endingRef.current || rt.over) return;
    const { log } = runSingleRound(rt, seedRef.current);
    setCombatLog((prev) => [...prev, ...log.map((e) => logEntryToLine(e, true))]);
    syncHpFromRuntime();
    checkEnd();
  }, [checkEnd, syncHpFromRuntime]);

  const startCombat = useCallback(() => {
    if (phase !== 'talk') return;
    endingRef.current = false;
    const maxHp = getPlayerMaxHp(questState);
    const playerFighter = buildFighterFromQuestState(questState, {
      id: 'player',
      currentHp: questState.health,
    });
    const enemyFighter = buildFighterFromEncounter(def);
    seedRef.current = generateCombatSeed();
    runtimeRef.current = createCombatRuntime(playerFighter, enemyFighter, true);

    setPhase('entering');
    setCombatLog([{ id: nextCombatLogId(), text: def.enterLine, tone: 'narrator' }]);
    setEnemyHp(enemyFighter.hp);
    setPlayerHp(playerFighter.hp);
    setPlayerMaxHp(maxHp);
    onCombatChromeChangeRef.current?.(true);

    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      enterTimerRef.current = null;
      setPhase('combat');
      setCombatLog((prev) => [
        ...prev,
        { id: nextCombatLogId(), text: 'Battle joined—your strikes land on their own rhythm.', tone: 'narrator' },
      ]);
      roundTimerRef.current = setInterval(() => advanceRound(), ROUND_DELAY_MS);
    }, ENTER_DELAY_MS);
  }, [advanceRound, def, phase, questState]);

  const fastForward = useCallback(() => {
    if (phase !== 'combat' && phase !== 'entering') return;
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (phase === 'entering') {
      setPhase('combat');
    }
    const rt = runtimeRef.current;
    if (!rt || endingRef.current) return;

    const newLines: CombatLogLine[] = [];
    while (!rt.over) {
      const { log } = runSingleRound(rt, seedRef.current);
      newLines.push(...log.map((e) => logEntryToLine(e, true)));
    }
    setCombatLog((prev) => [...prev, ...newLines]);
    syncHpFromRuntime();
    checkEnd();
  }, [checkEnd, phase, syncHpFromRuntime]);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [combatLog]);

  const isCombatMode = phase === 'entering' || phase === 'combat';

  return {
    phase,
    isCombatMode,
    combatLog,
    logEndRef,
    enemyHp,
    enemyMaxHp,
    playerHp,
    playerMaxHp,
    displayName: def.displayName,
    startCombat,
    fastForward,
    resetCombat: finishCombat,
  };
}
