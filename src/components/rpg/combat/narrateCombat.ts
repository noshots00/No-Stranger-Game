import type { CombatLogEntry, CombatRuntimeState, RoundCombatEvent, RoundResult } from './combatTypes';
import { getSkillDisplayName } from './skillRegistry';

function sideForFighter(state: CombatRuntimeState, fighterId: string): 'a' | 'b' {
  return state.fighterA.id === fighterId ? 'a' : 'b';
}

function narrateEvent(state: CombatRuntimeState, event: RoundCombatEvent): CombatLogEntry[] {
  const attackerName =
    state.fighterA.id === event.attackerId ? state.fighterA.name : state.fighterB.name;
  const defenderName =
    state.fighterA.id === event.defenderId ? state.fighterA.name : state.fighterB.name;
  const attackerSide = sideForFighter(state, event.attackerId);
  const defenderSide = sideForFighter(state, event.defenderId);

  if (!event.hit && event.defendedBy) {
    const detail = `${event.defendedBy} — ${event.rawDamage} raw`;
    if (attackerSide === 'a') {
      return [
        { text: `You attack — ${event.defendedBy.toLowerCase()}!`, side: 'a', detail },
        { text: `${defenderName} evades the blow.`, side: defenderSide, detail },
      ];
    }
    return [
      { text: `${attackerName} attacks — ${event.defendedBy.toLowerCase()}!`, side: attackerSide, detail },
      { text: 'You evade the blow.', side: 'b', detail },
    ];
  }

  if (event.damage === 0 && event.narrativeDetail === 'Taunt') {
    if (attackerSide === 'a') {
      return [{ text: 'You taunt — their next strike will falter.', side: 'a' }];
    }
    return [{ text: `${attackerName} taunts — your next strike will falter.`, side: attackerSide }];
  }

  const skillLabel =
    event.skillId && event.action !== 'auto_attack'
      ? getSkillDisplayName(event.skillId)
      : null;

  const dmgText =
    event.damage > 0
      ? event.isCrit
        ? ` (${event.damage} critical damage)`
        : ` (${event.damage} damage)`
      : '';

  if (attackerSide === 'a') {
    const verb = skillLabel ? `You cast ${skillLabel}` : 'You strike';
    return [{ text: `${verb}${dmgText}.`, side: 'a', detail: `raw ${event.rawDamage}` }];
  }

  const verb = skillLabel ? `${attackerName} casts ${skillLabel}` : `${attackerName} strikes`;
  return [{ text: `${verb}${dmgText}.`, side: attackerSide, detail: `raw ${event.rawDamage}` }];
}

export function narrateRound(state: CombatRuntimeState, round: RoundResult): CombatLogEntry[] {
  const lines: CombatLogEntry[] = [];
  for (const event of round.events) {
    lines.push(...narrateEvent(state, event));
  }
  return lines;
}
