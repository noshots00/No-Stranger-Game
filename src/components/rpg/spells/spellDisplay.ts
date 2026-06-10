/** Indigo spell name tier — matches loadout spell slot. */
export const SPELL_NAME_COLOR_CLASS = '!text-[var(--loadout-slot-spell)]';

export function spellNameClassName(className?: string): string {
  return ['rpg-spell-name', SPELL_NAME_COLOR_CLASS, className].filter(Boolean).join(' ');
}

export function spellNameColorStyle(): { color: string } {
  return { color: 'var(--loadout-slot-spell)' };
}
