import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type CombatLogLine, nextCombatLogId } from './combatLog';
import { getCombatEncounter, type CombatEncounterId } from './combatEncounters';

export type CombatPhase = 'talk' | 'entering' | 'combat' | 'ended';

const ENTER_DELAY_MS = 400;
const AUTO_ATTACK_TICK_MS = 2000;
const PLAYER_STRIKE_DAMAGE = 10;
const ENEMY_RETALIATE_DAMAGE = 4;
const VICTORY_RETURN_MS = 1200;

const PLAYER_STRIKE_LINES = [
  'You strike Carl.',
  'You press the attack.',
  'Your blow lands—Carl shifts his footing.',
] as const;

const ENEMY_RETALIATE_LINES = [
  'Carl parries and counters.',
  'Carl blocks, then answers with a sharp riposte.',
  'Carl meets your strike and gives ground only an inch.',
] as const;

function clampHealth(value: number): number {
  return Math.max(0, Math.min(100, value));
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
  const playerHealthRef = useRef(playerHealth);

  playerHealthRef.current = playerHealth;

  const appendLog = useCallback((text: string, tone: CombatLogLine['tone']) => {
    setCombatLog((prev) => [...prev, { id: nextCombatLogId(), text, tone }]);
  }, []);

  const finishCombat = useCallback(() => {
    endingRef.current = false;
    setPhase('talk');
    setCombatLog([]);
    setEnemyHp(def.maxEnemyHp);
    onCombatChromeChange?.(false);
  }, [def.maxEnemyHp, onCombatChromeChange]);

  const scheduleVictoryReturn = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    window.setTimeout(() => onVictory?.(), 0);
    setCombatLog((prev) => [
      ...prev,
      ...def.victoryLines.map((text) => ({
        id: nextCombatLogId(),
        text,
        tone: 'enemy' as const,
      })),
    ]);
    window.setTimeout(() => finishCombat(), VICTORY_RETURN_MS);
  }, [def.victoryLines, finishCombat, onVictory]);

  const startCombat = useCallback(() => {
    if (phase !== 'talk') return;
    endingRef.current = false;
    setPhase('entering');
    setCombatLog([{ id: nextCombatLogId(), text: def.enterLine, tone: 'narrator' }]);
    setEnemyHp(def.maxEnemyHp);
    onCombatChromeChange?.(true);

    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      enterTimerRef.current = null;
      setPhase('combat');
      appendLog('Battle joined—your strikes land on their own rhythm.', 'narrator');
    }, ENTER_DELAY_MS);
  }, [appendLog, def.enterLine, def.maxEnemyHp, onCombatChromeChange, phase]);

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

  useEffect(() => {
    if (phase !== 'combat' || endingRef.current) return;

    const timer = window.setInterval(() => {
      if (endingRef.current) return;

      setCombatLog((logPrev) => {
        const tick = logPrev.length;
        const playerLine = PLAYER_STRIKE_LINES[tick % PLAYER_STRIKE_LINES.length]!;
        const enemyLine = ENEMY_RETALIATE_LINES[tick % ENEMY_RETALIATE_LINES.length]!;
        return [
          ...logPrev,
          { id: nextCombatLogId(), text: playerLine, tone: 'player' },
          { id: nextCombatLogId(), text: enemyLine, tone: 'enemy' },
        ];
      });

      onPlayerHealthChange?.(clampHealth(playerHealthRef.current - ENEMY_RETALIATE_DAMAGE));

      setEnemyHp((hp) => {
        const nextHp = Math.max(0, hp - PLAYER_STRIKE_DAMAGE);
        if (nextHp <= 0) {
          window.clearInterval(timer);
          // Defer victory hooks — never call parent setState from inside this updater.
          window.setTimeout(() => scheduleVictoryReturn(), 0);
        }
        return nextHp;
      });
    }, AUTO_ATTACK_TICK_MS);

    return () => window.clearInterval(timer);
  }, [onPlayerHealthChange, phase, scheduleVictoryReturn]);

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
    playerHp: clampHealth(playerHealth),
    playerMaxHp: 100,
    displayName: def.displayName,
    startCombat,
    flee,
    resetCombat: finishCombat,
  };
}
