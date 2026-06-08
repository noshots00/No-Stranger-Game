export type CombatLogTone = 'player' | 'enemy' | 'narrator';

export type CombatLogLine = {
  id: string;
  text: string;
  tone: CombatLogTone;
  /** Numeric detail for tooltip / on-demand view. */
  detail?: string;
};

export function nextCombatLogId(): string {
  return `combat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
