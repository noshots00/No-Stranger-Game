/** Keys on `QuestState.skills` that use the shared XP / level curve. */
export const SKILL_XP_KEYS = ['explorationXp', 'foragingXp', 'meleeAttackXp'] as const;
export type SkillXpKey = (typeof SKILL_XP_KEYS)[number];

/** World-event line: "Your skill in &lt;label&gt; reached level N!" (lowercase, matches exploration copy). */
export const SKILL_EVENT_LABEL: Record<SkillXpKey, string> = {
  explorationXp: 'exploration',
  foragingXp: 'foraging',
  meleeAttackXp: 'melee attack',
};

/** Character sheet display name. */
export const SKILL_SHEET_LABEL: Record<SkillXpKey, string> = {
  explorationXp: 'Exploration',
  foragingXp: 'Foraging',
  meleeAttackXp: 'Melee Attack',
};

/** Player activity that drives daily XP distribution. */
export type SkillActivity = 'exploring';

/**
 * Per-activity weights across SKILL_XP_KEYS. Each row must sum to 1.0.
 * Add new activities here; the type union above forces exhaustive coverage.
 */
export const SKILL_ACTIVITY_WEIGHTS: Record<SkillActivity, Record<SkillXpKey, number>> = {
  exploring: { explorationXp: 0.8, foragingXp: 0.2, meleeAttackXp: 0 },
};

export const DEFAULT_SKILL_ACTIVITY: SkillActivity = 'exploring';

/**
 * Distribute `totalXp` across SKILL_XP_KEYS using the weights for `activity`.
 * Uses the largest-remainder method so the integer parts always sum to `totalXp`
 * (no XP gained or lost to flooring).
 */
export function distributeDailySkillXp(
  totalXp: number,
  activity: SkillActivity = DEFAULT_SKILL_ACTIVITY,
): Record<SkillXpKey, number> {
  const out = Object.fromEntries(SKILL_XP_KEYS.map((k) => [k, 0])) as Record<SkillXpKey, number>;
  if (totalXp <= 0) return out;

  const weights = SKILL_ACTIVITY_WEIGHTS[activity];
  const exact: Array<{ key: SkillXpKey; floor: number; frac: number }> = SKILL_XP_KEYS.map((key) => {
    const raw = totalXp * (weights[key] ?? 0);
    const floor = Math.floor(raw);
    return { key, floor, frac: raw - floor };
  });

  let assigned = 0;
  for (const r of exact) {
    out[r.key] = r.floor;
    assigned += r.floor;
  }

  let remainder = totalXp - assigned;
  const order = [...exact].sort(
    (a, b) => b.frac - a.frac || SKILL_XP_KEYS.indexOf(a.key) - SKILL_XP_KEYS.indexOf(b.key),
  );
  for (const r of order) {
    if (remainder <= 0) break;
    if ((weights[r.key] ?? 0) === 0) continue;
    out[r.key] += 1;
    remainder -= 1;
  }
  return out;
}
