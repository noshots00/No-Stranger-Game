import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { snapshotToFighter } from '../combat/buildFighter';
import { type CombatLogLine, nextCombatLogId } from '../combat/combatLog';
import type { CombatLogEntry, CombatRuntimeState } from '../combat/combatTypes';
import { createCombatRuntime, runSingleRound } from '../combat/runCombat';
import type { ArenaMatchPayloadV1 } from './arenaCombat';

const ENTER_DELAY_MS = 400;
const ROUND_DELAY_MS = 2000;

type UseArenaFightReplayOptions = {
  payload: ArenaMatchPayloadV1 | null;
  active: boolean;
};

function logEntryToSpectatorLine(entry: CombatLogEntry, fighterAName: string): CombatLogLine {
  const tone: CombatLogLine['tone'] =
    entry.side === 'narrator' ? 'narrator' : entry.side === 'a' ? 'player' : 'enemy';
  let text = entry.text;
  if (entry.side === 'a') {
    text = text.replace(/^You\b/, fighterAName).replace(/\byour\b/gi, 'their');
  }
  return {
    id: nextCombatLogId(),
    text,
    tone,
    detail: entry.detail,
  };
}

export function useArenaFightReplay({ payload, active }: UseArenaFightReplayOptions) {
  const [phase, setPhase] = useState<'idle' | 'entering' | 'combat' | 'ended'>('idle');
  const [combatLog, setCombatLog] = useState<CombatLogLine[]>([]);
  const [fighterAHp, setFighterAHp] = useState(0);
  const [fighterBHp, setFighterBHp] = useState(0);
  const [fighterAMaxHp, setFighterAMaxHp] = useState(0);
  const [fighterBMaxHp, setFighterBMaxHp] = useState(0);
  const [fighterAName, setFighterAName] = useState('');
  const [fighterBName, setFighterBName] = useState('');

  const logEndRef = useRef<HTMLDivElement | null>(null);
  const endingRef = useRef(false);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runtimeRef = useRef<CombatRuntimeState | null>(null);
  const seedRef = useRef('');

  const clearTimers = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
  }, []);

  const syncHpFromRuntime = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt) return;
    setFighterAHp(rt.fighterA.hp);
    setFighterBHp(rt.fighterB.hp);
  }, []);

  const finishReplay = useCallback(() => {
    endingRef.current = false;
    clearTimers();
    runtimeRef.current = null;
    seedRef.current = '';
    setPhase('idle');
    setCombatLog([]);
    setFighterAHp(0);
    setFighterBHp(0);
    setFighterAMaxHp(0);
    setFighterBMaxHp(0);
    setFighterAName('');
    setFighterBName('');
  }, [clearTimers]);

  const markEnded = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    clearTimers();
    syncHpFromRuntime();
    const rt = runtimeRef.current;
    if (!rt?.winnerId) {
      setPhase('ended');
      return;
    }
    const winnerName =
      rt.winnerId === rt.fighterA.id ? rt.fighterA.name : rt.fighterB.name;
    setCombatLog((prev) => [
      ...prev,
      { id: nextCombatLogId(), text: `${winnerName} wins the bout.`, tone: 'narrator' },
    ]);
    setPhase('ended');
  }, [clearTimers, syncHpFromRuntime]);

  const advanceRound = useCallback(() => {
    const rt = runtimeRef.current;
    if (!rt || endingRef.current || rt.over) return;
    const name = rt.fighterA.name;
    const { log } = runSingleRound(rt, seedRef.current);
    setCombatLog((prev) => [...prev, ...log.map((e) => logEntryToSpectatorLine(e, name))]);
    syncHpFromRuntime();
    if (rt.over) markEnded();
  }, [markEnded, syncHpFromRuntime]);

  const startReplay = useCallback(() => {
    if (!payload) return;
    clearTimers();
    endingRef.current = false;

    const fighterA = snapshotToFighter(payload.fighterA);
    const fighterB = snapshotToFighter(payload.fighterB);
    seedRef.current = payload.seed;
    runtimeRef.current = createCombatRuntime(fighterA, fighterB, true);

    setFighterAName(fighterA.name);
    setFighterBName(fighterB.name);
    setFighterAHp(fighterA.hp);
    setFighterBHp(fighterB.hp);
    setFighterAMaxHp(fighterA.maxHp);
    setFighterBMaxHp(fighterB.maxHp);
    setPhase('entering');
    setCombatLog([
      {
        id: nextCombatLogId(),
        text: `${fighterA.name} vs ${fighterB.name} — the crowd goes quiet.`,
        tone: 'narrator',
      },
    ]);

    enterTimerRef.current = setTimeout(() => {
      enterTimerRef.current = null;
      setPhase('combat');
      setCombatLog((prev) => [
        ...prev,
        {
          id: nextCombatLogId(),
          text: 'Steel rings; the bout begins.',
          tone: 'narrator',
        },
      ]);
      roundTimerRef.current = setInterval(() => advanceRound(), ROUND_DELAY_MS);
    }, ENTER_DELAY_MS);
  }, [advanceRound, clearTimers, payload]);

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

    const name = rt.fighterA.name;
    const newLines: CombatLogLine[] = [];
    while (!rt.over) {
      const { log } = runSingleRound(rt, seedRef.current);
      newLines.push(...log.map((e) => logEntryToSpectatorLine(e, name)));
    }
    setCombatLog((prev) => [...prev, ...newLines]);
    syncHpFromRuntime();
    markEnded();
  }, [markEnded, phase, syncHpFromRuntime]);

  useEffect(() => {
    if (!active || !payload) {
      finishReplay();
      return undefined;
    }
    startReplay();
    return () => {
      finishReplay();
    };
  }, [active, payload?.seed, finishReplay, startReplay]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useLayoutEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [combatLog]);

  const isWatching = phase === 'entering' || phase === 'combat' || phase === 'ended';

  return {
    phase,
    isWatching,
    combatLog,
    logEndRef,
    fighterAHp,
    fighterBHp,
    fighterAMaxHp,
    fighterBMaxHp,
    fighterAName,
    fighterBName,
    fastForward,
    stopReplay: finishReplay,
  };
}
