import { buildFighterFromQuestState, fighterToSnapshot, snapshotToFighter } from '../combat/buildFighter';
import { generateCombatSeed } from '../combat/combatRng';
import { runCombat } from '../combat/runCombat';
import type { FighterSnapshot } from '../combat/combatTypes';
import type { QuestState } from '../quests/types';

export type ArenaMatchPayloadV1 = {
  v: 1;
  seed: string;
  winner: string;
  fighterA: FighterSnapshot;
  fighterB: FighterSnapshot;
  log: string[];
  finalHp: Record<string, number>;
  summary: string;
};

export function buildArenaFighterSnapshot(
  state: QuestState,
  pubkey: string
): FighterSnapshot {
  const fighter = buildFighterFromQuestState(state, {
    id: pubkey,
    pubkey,
    currentHp: state.health,
  });
  return fighterToSnapshot(fighter);
}

export function parseArenaMatchPayload(content: string): ArenaMatchPayloadV1 | null {
  if (!content.trim()) return null;
  try {
    const raw = JSON.parse(content) as ArenaMatchPayloadV1;
    if (raw.v !== 1 || !raw.seed || !raw.winner || !raw.fighterA || !raw.fighterB) return null;
    return raw;
  } catch {
    return null;
  }
}

export function simulateArenaMatch(
  fighterA: FighterSnapshot,
  fighterB: FighterSnapshot,
  seed?: string
): ArenaMatchPayloadV1 {
  const combatSeed = seed ?? generateCombatSeed();
  const stateA = snapshotToFighter(fighterA);
  const stateB = snapshotToFighter(fighterB);
  const outcome = runCombat({
    fighterA: stateA,
    fighterB: stateB,
    seed: combatSeed,
    playerIsA: false,
  });
  const aKey = fighterA.pubkey ?? fighterA.id;
  const winner = outcome.winnerId === fighterA.id || outcome.winnerId === aKey ? aKey : (fighterB.pubkey ?? fighterB.id);

  return {
    v: 1,
    seed: combatSeed,
    winner,
    fighterA,
    fighterB,
    log: outcome.log.map((e) => e.text),
    finalHp: outcome.finalHp,
    summary: '',
  };
}

export function verifyArenaMatchPayload(payload: ArenaMatchPayloadV1): boolean {
  const replay = simulateArenaMatch(payload.fighterA, payload.fighterB, payload.seed);
  return replay.winner === payload.winner;
}
