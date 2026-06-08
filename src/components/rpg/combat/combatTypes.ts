/** Four-slot combat loadout (weapon, other, two active skills/spells). */
export type CombatLoadout = {
  weapon?: string;
  other?: string;
  skillA?: string;
  skillB?: string;
};

export type FighterStats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type PassiveSkillSlot = {
  skillId: string;
  level: number;
};

/** Runtime fighter in combat (player or NPC). */
export type FighterState = {
  id: string;
  name: string;
  level: number;
  stats: FighterStats;
  hp: number;
  maxHp: number;
  loadout: CombatLoadout;
  passives: PassiveSkillSlot[];
  /** Skill levels keyed by canonical skill id. */
  skillLevels: Record<string, number>;
  race?: string;
  className?: string;
  pubkey?: string;
};

/** Serializable snapshot for arena registration / match replay. */
export type FighterSnapshot = {
  id: string;
  name: string;
  level: number;
  stats: FighterStats;
  maxHp: number;
  loadout: CombatLoadout;
  passives: PassiveSkillSlot[];
  skillLevels: Record<string, number>;
  race?: string;
  className?: string;
  pubkey?: string;
};

export type CombatActionKind = 'auto_attack' | 'skill_a' | 'skill_b' | 'skill_extra';

export type RoundCombatEvent = {
  attackerId: string;
  defenderId: string;
  action: CombatActionKind;
  skillId?: string;
  hit: boolean;
  damage: number;
  rawDamage: number;
  isCrit: boolean;
  defendedBy?: string;
  narrativeDetail?: string;
};

export type RoundResult = {
  round: number;
  events: RoundCombatEvent[];
  fighterHp: Record<string, number>;
};

export type CombatLogEntry = {
  text: string;
  side: 'a' | 'b' | 'narrator';
  detail?: string;
};

export type CombatOutcome = {
  winnerId: string | null;
  loserId: string | null;
  rounds: RoundResult[];
  log: CombatLogEntry[];
  finalHp: Record<string, number>;
  seed: string;
};

export type CombatBuffState = {
  /** Defender id → damage multiplier on next incoming attack (e.g. Taunt 0.5). */
  nextAttackDamageMultiplier: Record<string, number>;
  /** Attacker id → damage bonus percent this round (e.g. Courage +5%). */
  roundDamageBonusPct: Record<string, number>;
};

export type CombatRuntimeState = {
  fighterA: FighterState;
  fighterB: FighterState;
  round: number;
  buffs: CombatBuffState;
  attackerIsA: boolean;
  over: boolean;
  winnerId: string | null;
};
