import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type CombatLogLine, nextCombatLogId } from './combatLog';
import { getCombatEncounter, type CombatEncounterId } from './combatEncounters';

export type CombatPhase = 'talk' | 'entering' | 'combat' | 'ended';

const ENTER_DELAY_MS = 400;
const AUTO_ATTACK_TICK_MS = 2000;
const PLAYER_STRIKE_DAMAGE = 10;
const ENEMY_RETALIATE_DAMAGE = 4;
const VICTORY_RETURN_MS = 1200;

function clampHealth(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.max(0, Math.min(100, Math.floor(value)));
}

function resolvePlayerHealth(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? clampHealth(value) : 100;
}

type UseCombatEncounterOptions = {
  encounterId: CombatEncounterId;
  playerHealth: number;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  /** Fires once when enemy HP reaches zero (before returning to talk). */
  onVictory?: () => void;
};

export function useCombatEncounter({
  encounterId,
  playerHealth,
  onPlayerHealthChange,
  onCombatChromeChange,
  onVictory,
}: UseCombatEncounterOptions) {
  const def = getCombatEncounter(encounterId);
  const [phase, setPhase] = useState<CombatPhase>('talk');
  const [combatLog, setCombatLog] = useState<CombatLogLine[]>([]);
  const [enemyHp, setEnemyHp] = useState(def.maxEnemyHp);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const endingRef = useRef(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerHealthRef = useRef(resolvePlayerHealth(playerHealth));
  const onPlayerHealthChangeRef = useRef(onPlayerHealthChange);
  const onCombatChromeChangeRef = useRef(onCombatChromeChange);
  const onVictoryRef = useRef(onVictory);

  playerHealthRef.current = resolvePlayerHealth(playerHealth);
  onPlayerHealthChangeRef.current = onPlayerHealthChange;
  onCombatChromeChangeRef.current = onCombatChromeChange;
  onVictoryRef.current = onVictory;

  const appendLog = useCallback((text: string, tone: CombatLogLine['tone']) => {
    setCombatLog((prev) => [...prev, { id: nextCombatLogId(), text, tone }]);
  }, []);

  const finishCombat = useCallback(() => {
    endingRef.current = false;
    setPhase('talk');
    setCombatLog([]);
    setEnemyHp(def.maxEnemyHp);
    onCombatChromeChangeRef.current?.(false);
  }, [def.maxEnemyHp]);

  const scheduleVictoryReturn = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
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
    setCombatLog((prev) => [
      ...prev,
      ...def.defeatLines.map((text) => ({
        id: nextCombatLogId(),
        text,
        tone: 'narrator' as const,
      })),
    ]);
    window.setTimeout(() => {
      onPlayerHealthChangeRef.current?.(100);
      playerHealthRef.current = 100;
      finishCombat();
    }, VICTORY_RETURN_MS);
  }, [def.defeatLines, finishCombat]);

  const startCombat = useCallback(() => {
    if (phase !== 'talk') return;
    endingRef.current = false;
    setPhase('entering');
    setCombatLog([{ id: nextCombatLogId(), text: def.enterLine, tone: 'narrator' }]);
    setEnemyHp(def.maxEnemyHp);
    onCombatChromeChangeRef.current?.(true);

    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      enterTimerRef.current = null;
      setPhase('combat');
      appendLog('Battle joined—your strikes land on their own rhythm.', 'narrator');
    }, ENTER_DELAY_MS);
  }, [appendLog, def.enterLine, def.maxEnemyHp, phase]);

  const flee = useCallback(() => {
    if (phase !== 'combat' && phase !== 'entering') return;
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    endingRef.current = true;
    appendLog(def.fleeLine, 'narrator');
    window.setTimeout(() => finishCombat(), 400);
  }, [appendLog, def.fleeLine, finishCombat, phase]);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
  }, []);

  const scheduleVictoryReturnRef = useRef(scheduleVictoryReturn);
  scheduleVictoryReturnRef.current = scheduleVictoryReturn;
  const scheduleDefeatReturnRef = useRef(scheduleDefeatReturn);
  scheduleDefeatReturnRef.current = scheduleDefeatReturn;

  useEffect(() => {
    if (phase !== 'combat' || endingRef.current) return;

    const playerStrikeLines = def.playerStrikeLines;
    const enemyRetaliateLines = def.enemyRetaliateLines;

    const timer = window.setInterval(() => {
      if (endingRef.current) return;

      setCombatLog((logPrev) => {
        const tick = logPrev.length;
        const playerLine = playerStrikeLines[tick % playerStrikeLines.length]!;
        const enemyLine = enemyRetaliateLines[tick % enemyRetaliateLines.length]!;
        return [
          ...logPrev,
          { id: nextCombatLogId(), text: playerLine, tone: 'player' },
          { id: nextCombatLogId(), text: enemyLine, tone: 'enemy' },
        ];
      });

      const nextPlayerHp = clampHealth(playerHealthRef.current - ENEMY_RETALIATE_DAMAGE);
      playerHealthRef.current = nextPlayerHp;
      onPlayerHealthChangeRef.current?.(nextPlayerHp);

      if (nextPlayerHp <= 0) {
        window.clearInterval(timer);
        window.setTimeout(() => scheduleDefeatReturnRef.current(), 0);
        return;
      }

      setEnemyHp((hp) => {
        const nextHp = Math.max(0, hp - PLAYER_STRIKE_DAMAGE);
        if (nextHp <= 0) {
          window.clearInterval(timer);
          // Defer victory hooks — never call parent setState from inside this updater.
          window.setTimeout(() => scheduleVictoryReturnRef.current(), 0);
        }
        return nextHp;
      });
    }, AUTO_ATTACK_TICK_MS);

    return () => window.clearInterval(timer);
  }, [def.enemyRetaliateLines, def.playerStrikeLines, phase]);

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
    enemyMaxHp: def.maxEnemyHp,
    playerHp: resolvePlayerHealth(playerHealth),
    playerMaxHp: 100,
    displayName: def.displayName,
    startCombat,
    flee,
    resetCombat: finishCombat,
  };
}
