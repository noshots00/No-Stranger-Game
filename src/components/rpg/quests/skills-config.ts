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

/** Skills that receive the same daily XP grant as exploration when a new in-game day ticks. */
export const SKILLS_WITH_DAILY_XP: readonly SkillXpKey[] = [...SKILL_XP_KEYS];

/**
 * Distribute a daily XP grant evenly across `SKILLS_WITH_DAILY_XP`.
 * Uses `Math.floor` per skill; any remainder is added to the first skill so totals match `totalXp`.
 *
 * Future: replace with a weighted distribution (per-skill weights).
 */
export function distributeDailySkillXp(totalXp: number): Record<SkillXpKey, number> {
  const skills = SKILLS_WITH_DAILY_XP;
  const out = Object.fromEntries(skills.map((key) => [key, 0])) as Record<SkillXpKey, number>;
  if (skills.length === 0 || totalXp <= 0) return out;
  const base = Math.floor(totalXp / skills.length);
  const remainder = totalXp - base * skills.length;
  for (const key of skills) {
    out[key] = base;
  }
  out[skills[0]] += remainder;
  return out;
}
