/** Green skill name tier — matches loadout skill slot. */
export const SKILL_NAME_COLOR_CLASS = '!text-[var(--loadout-slot-skill)]';

export function skillNameClassName(className?: string): string {
  return ['rpg-skill-name', SKILL_NAME_COLOR_CLASS, className].filter(Boolean).join(' ');
}

export function skillNameColorStyle(): { color: string } {
  return { color: 'var(--loadout-slot-skill)' };
}
