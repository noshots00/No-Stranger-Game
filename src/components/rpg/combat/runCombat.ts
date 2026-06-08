import { createCombatRng } from './combatRng';
import { narrateRound } from './narrateCombat';
import { createCombatRuntime, resolveRound } from './resolveRound';
import type { CombatLogEntry, CombatOutcome, FighterState, RoundResult } from './combatTypes';

const MAX_ROUNDS_SAFETY = 500;

export type RunCombatOptions = {
  fighterA: FighterState;
  fighterB: FighterState;
  seed: string;
  /** Fighter A is the player (narration "you"). */
  playerIsA?: boolean;
  maxRounds?: number;
};

export function runCombat(opts: RunCombatOptions): CombatOutcome {
  const state = createCombatRuntime(opts.fighterA, opts.fighterB, opts.playerIsA ?? true);
  const rounds: RoundResult[] = [];
  const log: CombatLogEntry[] = [];
  const cap = opts.maxRounds ?? MAX_ROUNDS_SAFETY;

  while (!state.over && state.round < cap) {
    const rng = createCombatRng(opts.seed, state.round);
    const round = resolveRound(state, rng);
    rounds.push(round);
    log.push(...narrateRound(state, round));
  }

  const loserId =
    state.winnerId === state.fighterA.id
      ? state.fighterB.id
      : state.winnerId === state.fighterB.id
        ? state.fighterA.id
        : null;

  return {
    winnerId: state.winnerId,
    loserId,
    rounds,
    log,
    finalHp: {
      [state.fighterA.id]: state.fighterA.hp,
      [state.fighterB.id]: state.fighterB.hp,
    },
    seed: opts.seed,
  };
}

/** Run a single round; returns updated runtime state (mutates internal fighters). */
export function runSingleRound(
  state: ReturnType<typeof createCombatRuntime>,
  seed: string
): { state: typeof state; round: RoundResult; log: CombatLogEntry[] } {
  const rng = createCombatRng(seed, state.round);
  const round = resolveRound(state, rng);
  const log = narrateRound(state, round);
  return { state, round, log };
}

export { createCombatRuntime };
