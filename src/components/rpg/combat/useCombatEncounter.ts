import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { QuestState } from '../quests/types';
import { buildFighterFromEncounter, buildFighterFromQuestState } from './buildFighter';
import { getCombatEncounter, type CombatEncounterId } from './combatEncounters';
import { type CombatLogLine, nextCombatLogId } from './combatLog';
import type { CombatLogEntry } from './combatTypes';
import { generateCombatSeed } from './combatRng';
import { getPlayerMaxHp } from './playerHealth';
import { getRacePortraitSrc } from '@/components/rpg/rpgArtAssignments';
import { createCombatRuntime, runSingleRound } from './runCombat';
import type { CombatRuntimeState } from './combatTypes';

export type CombatPhase = 'talk' | 'entering' | 'combat' | 'resolution';
export type CombatResolutionOutcome = 'victory' | 'defeat';

const ENTER_DELAY_MS = 400;
const ROUND_DELAY_MS = 2000;

type UseCombatEncounterOptions = {
  encounterId: CombatEncounterId;
  questState: QuestState;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onVictory?: () => void;
  onDefeat?: () => void;
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
  onDefeat,
}: UseCombatEncounterOptions) {
  const def = getCombatEncounter(encounterId);
  const [phase, setPhase] = useState<CombatPhase>('talk');
  const [combatLog, setCombatLog] = useState<CombatLogLine[]>([]);
  const [enemyHp, setEnemyHp] = useState(def.fighter.maxHp ?? 0);
  const [playerHp, setPlayerHp] = useState(questState.health);
  const [playerMaxHp, setPlayerMaxHp] = useState(getPlayerMaxHp(questState));
  const [isPaused, setIsPaused] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState<CombatResolutionOutcome | null>(null);
  const [resolutionLines, setResolutionLines] = useState<readonly string[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const endingRef = useRef(false);
  const isPausedRef = useRef(false);
  const pausedDuringEnteringRef = useRef(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runtimeRef = useRef<CombatRuntimeState | null>(null);
  const seedRef = useRef('');
  const onPlayerHealthChangeRef = useRef(onPlayerHealthChange);
  const onCombatChromeChangeRef = useRef(onCombatChromeChange);
  const onVictoryRef = useRef(onVictory);
  const onDefeatRef = useRef(onDefeat);
  const questStateHealthRef = useRef(questState.health);
  const resolutionOutcomeRef = useRef<CombatResolutionOutcome | null>(null);

  onPlayerHealthChangeRef.current = onPlayerHealthChange;
  onCombatChromeChangeRef.current = onCombatChromeChange;
  onVictoryRef.current = onVictory;
  onDefeatRef.current = onDefeat;
  questStateHealthRef.current = questState.health;

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

  const clearRoundTimer = useCallback(() => {
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
  }, []);

  const finishCombat = useCallback(() => {
    endingRef.current = false;
    isPausedRef.current = false;
    pausedDuringEnteringRef.current = false;
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    clearRoundTimer();
    runtimeRef.current = null;
    setIsPaused(false);
    setIsEnding(false);
    setResolutionOutcome(null);
    setResolutionLines([]);
    resolutionOutcomeRef.current = null;
    setPhase('talk');
    setCombatLog([]);
    setEnemyHp(enemyMaxHp);
    setPlayerHp(questStateHealthRef.current);
    setPlayerMaxHp(getPlayerMaxHp(questState));
    onCombatChromeChangeRef.current?.(false);
  }, [clearRoundTimer, enemyMaxHp, questState]);

  const enterResolution = useCallback(
    (outcome: CombatResolutionOutcome, lines: readonly string[]) => {
      if (endingRef.current) return;
      endingRef.current = true;
      setIsEnding(true);
      isPausedRef.current = false;
      setIsPaused(false);
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
      clearRoundTimer();
      setResolutionOutcome(outcome);
      setResolutionLines(lines);
      resolutionOutcomeRef.current = outcome;
      setPhase('resolution');
    },
    [clearRoundTimer]
  );

  const scheduleVictoryReturn = useCallback(() => {
    enterResolution('victory', def.victoryLines);
  }, [def.victoryLines, enterResolution]);

  const scheduleDefeatReturn = useCallback(() => {
    enterResolution('defeat', def.defeatLines);
  }, [def.defeatLines, enterResolution]);

  const dismissResolution = useCallback(() => {
    const outcome = resolutionOutcomeRef.current;
    if (!outcome) return;
    if (outcome === 'victory') {
      onVictoryRef.current?.();
    } else {
      onDefeatRef.current?.();
    }
    finishCombat();
  }, [finishCombat]);

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
    if (!rt || endingRef.current || rt.over || isPausedRef.current) return;
    const { log } = runSingleRound(rt, seedRef.current);
    setCombatLog((prev) => [...prev, ...log.map((e) => logEntryToLine(e, true))]);
    syncHpFromRuntime();
    checkEnd();
  }, [checkEnd, syncHpFromRuntime]);

  const startRoundTimer = useCallback(() => {
    if (roundTimerRef.current || isPausedRef.current || endingRef.current) return;
    roundTimerRef.current = setInterval(() => advanceRound(), ROUND_DELAY_MS);
  }, [advanceRound]);

  const beginActiveCombat = useCallback(() => {
    setPhase('combat');
    setCombatLog((prev) => [
      ...prev,
      { id: nextCombatLogId(), text: 'Battle joined—your strikes land on their own rhythm.', tone: 'narrator' },
    ]);
    advanceRound();
    startRoundTimer();
  }, [advanceRound, startRoundTimer]);

  const resumeEntering = useCallback(() => {
    enterTimerRef.current = setTimeout(() => {
      enterTimerRef.current = null;
      beginActiveCombat();
    }, ENTER_DELAY_MS);
  }, [beginActiveCombat]);

  const togglePause = useCallback(() => {
    if (endingRef.current || (phase !== 'entering' && phase !== 'combat')) return;

    if (!isPausedRef.current) {
      isPausedRef.current = true;
      setIsPaused(true);
      if (phase === 'entering' && enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
        pausedDuringEnteringRef.current = true;
      } else if (phase === 'combat') {
        clearRoundTimer();
      }
      return;
    }

    isPausedRef.current = false;
    setIsPaused(false);
    if (pausedDuringEnteringRef.current) {
      pausedDuringEnteringRef.current = false;
      resumeEntering();
    } else if (phase === 'combat') {
      startRoundTimer();
    }
  }, [clearRoundTimer, phase, resumeEntering, startRoundTimer]);

  const startCombat = useCallback(() => {
    if (phase !== 'talk') return;
    endingRef.current = false;
    isPausedRef.current = false;
    pausedDuringEnteringRef.current = false;
    setIsPaused(false);
    setIsEnding(false);
    setResolutionOutcome(null);
    setResolutionLines([]);
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
    resumeEntering();
  }, [def, phase, questState, resumeEntering]);

  const fastForward = useCallback(() => {
    if (phase !== 'combat' && phase !== 'entering') return;
    isPausedRef.current = false;
    pausedDuringEnteringRef.current = false;
    setIsPaused(false);
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    clearRoundTimer();
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
  }, [checkEnd, clearRoundTimer, phase, syncHpFromRuntime]);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [combatLog]);

  const isCombatMode = phase === 'entering' || phase === 'combat' || phase === 'resolution';
  const isResolutionMode = phase === 'resolution';
  const playerLabel = questState.playerName.trim() || 'You';

  return {
    phase,
    isCombatMode,
    isResolutionMode,
    isPaused,
    isEnding,
    resolutionOutcome,
    resolutionLines,
    combatLog,
    logEndRef,
    enemyHp,
    enemyMaxHp,
    playerHp,
    playerMaxHp,
    displayName: def.displayName,
    playerLabel,
    playerPortraitSrc: getRacePortraitSrc(questState.assignedRaceSlug),
    playerPortraitAlt: playerLabel,
    enemyPortraitSrc: def.portraitSrc,
    enemyPortraitAlt: def.portraitAlt,
    startCombat,
    fastForward,
    togglePause,
    dismissResolution,
    resetCombat: finishCombat,
  };
}
