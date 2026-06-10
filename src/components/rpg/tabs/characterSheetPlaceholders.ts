/** Tiles per row on the character sheet (combat + spells). */
export const ABILITY_TILES_PER_ROW = 5;

function numberedPlaceholders(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);
}

/** Placeholder rows in the primary-stats skill columns (until real data wires in). */
export const SHEET_COMBAT_SKILL_PLACEHOLDERS = numberedPlaceholders('placeholder skill', 3);
export const SHEET_PASSIVE_SKILL_PLACEHOLDERS = numberedPlaceholders('placeholder skill', 4);
export const SHEET_SPELL_PLACEHOLDERS = numberedPlaceholders('placeholder skill', 2);
