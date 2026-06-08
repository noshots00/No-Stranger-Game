import type { CombatRng } from './combatRng';
import type {
  CombatActionKind,
  CombatBuffState,
  CombatRuntimeState,
  FighterState,
  RoundCombatEvent,
  RoundResult,
} from './combatTypes';
import {
  finalizeDamage,
  resolveActiveSkill,
  resolveAutoAttack,
  resolveDefense,
} from './skillRegistry';

function emptyBuffs(): CombatBuffState {
  return { nextAttackDamageMultiplier: {}, roundDamageBonusPct: {} };
}

export function createCombatRuntime(
  fighterA: FighterState,
  fighterB: FighterState,
  playerIsA = true
): CombatRuntimeState {
  void playerIsA;
  return {
    fighterA: { ...fighterA, hp: fighterA.hp },
    fighterB: { ...fighterB, hp: fighterB.hp },
    round: 0,
    buffs: emptyBuffs(),
    attackerIsA: true,
    over: false,
    winnerId: null,
  };
}

function getFighter(state: CombatRuntimeState, isA: boolean): FighterState {
  return isA ? state.fighterA : state.fighterB;
}

function setFighterHp(state: CombatRuntimeState, isA: boolean, hp: number): void {
  if (isA) state.fighterA.hp = hp;
  else state.fighterB.hp = hp;
}

function chooseAction(
  attacker: FighterState,
  rng: CombatRng,
  extraSkillId?: string
): { action: CombatActionKind; skillId?: string } {
  const roll = rng.rollPercent();
  const hasA = Boolean(attacker.loadout.skillA);
  const hasB = Boolean(attacker.loadout.skillB);
  const hasExtra = Boolean(extraSkillId);

  if (hasExtra && hasA && hasB) {
    if (roll <= 25 && hasA) return { action: 'skill_a', skillId: attacker.loadout.skillA };
    if (roll <= 50 && hasB) return { action: 'skill_b', skillId: attacker.loadout.skillB };
    if (roll <= 75) return { action: 'skill_extra', skillId: extraSkillId };
    return { action: 'auto_attack' };
  }

  if (roll <= 33 && hasA) return { action: 'skill_a', skillId: attacker.loadout.skillA };
  if (roll <= 66 && hasB) return { action: 'skill_b', skillId: attacker.loadout.skillB };
  return { action: 'auto_attack' };
}

function evaluateRoundTraits(attacker: FighterState, buffs: CombatBuffState): void {
  if (attacker.hp < attacker.maxHp * 0.5) {
    buffs.roundDamageBonusPct[attacker.id] =
      (buffs.roundDamageBonusPct[attacker.id] ?? 0) + 5;
  }
}

function checkWinner(state: CombatRuntimeState): void {
  if (state.fighterA.hp <= 0 && state.fighterB.hp <= 0) {
    state.over = true;
    state.winnerId = null;
    return;
  }
  if (state.fighterA.hp <= 0) {
    state.over = true;
    state.winnerId = state.fighterB.id;
    return;
  }
  if (state.fighterB.hp <= 0) {
    state.over = true;
    state.winnerId = state.fighterA.id;
  }
}

export function resolveRound(state: CombatRuntimeState, rng: CombatRng): RoundResult {
  state.round += 1;
  state.buffs.roundDamageBonusPct = {};

  const attackerIsA = state.attackerIsA;
  const defenderIsA = !attackerIsA;
  const attacker = getFighter(state, attackerIsA);
  const defender = getFighter(state, defenderIsA);

  evaluateRoundTraits(attacker, state.buffs);

  const { action, skillId } = chooseAction(attacker, rng);
  const events: RoundCombatEvent[] = [];

  let skillResult =
    action === 'auto_attack'
      ? resolveAutoAttack(attacker, defender)
      : resolveActiveSkill(skillId ?? '', attacker, defender, rng);

  if (skillResult.appliesDebuff?.type === 'next_attack_half') {
    state.buffs.nextAttackDamageMultiplier[skillResult.appliesDebuff.targetId] = 0.5;
  }

  const defense = resolveDefense(defender, attacker, rng);
  let damage = 0;
  let hit = true;

  if (defense.negated) {
    hit = false;
    events.push({
      attackerId: attacker.id,
      defenderId: defender.id,
      action,
      skillId,
      hit: false,
      damage: 0,
      rawDamage: skillResult.rawDamage,
      isCrit: false,
      defendedBy: defense.defendedBy,
    });
  } else if (skillResult.rawDamage > 0 || action !== 'auto_attack') {
    const mult = state.buffs.nextAttackDamageMultiplier[defender.id] ?? 1;
    if (mult !== 1) {
      delete state.buffs.nextAttackDamageMultiplier[defender.id];
    }
    const bonusPct = state.buffs.roundDamageBonusPct[attacker.id] ?? 0;
    damage = finalizeDamage(
      skillResult.rawDamage,
      attacker,
      defender,
      skillResult.isCrit,
      skillResult.isSpell,
      bonusPct,
      mult
    );
    const newHp = Math.max(0, defender.hp - damage);
    setFighterHp(state, defenderIsA, newHp);
    defender.hp = newHp;

    events.push({
      attackerId: attacker.id,
      defenderId: defender.id,
      action,
      skillId,
      hit: true,
      damage,
      rawDamage: skillResult.rawDamage,
      isCrit: skillResult.isCrit,
      narrativeDetail: skillResult.flavor,
    });
  } else {
    events.push({
      attackerId: attacker.id,
      defenderId: defender.id,
      action,
      skillId,
      hit: true,
      damage: 0,
      rawDamage: 0,
      isCrit: false,
      narrativeDetail: skillResult.flavor,
    });
  }

  checkWinner(state);

  if (!state.over) {
    state.attackerIsA = !state.attackerIsA;
  }

  return {
    round: state.round,
    events,
    fighterHp: {
      [state.fighterA.id]: state.fighterA.hp,
      [state.fighterB.id]: state.fighterB.hp,
    },
  };
}
