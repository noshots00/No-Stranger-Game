/** Character-sheet style: `Level 3 Human Fighter` (no slashes or middots). */
export function formatFighterIdentitySubtitle(fighter: {
  level: number;
  race?: string | null;
  className?: string | null;
}): string {
  const parts = [`Level ${fighter.level}`];
  const race = fighter.race?.trim();
  const className = fighter.className?.trim();
  if (race) parts.push(race);
  if (className) parts.push(className);
  return parts.join(' ');
}
