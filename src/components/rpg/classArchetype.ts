import type { ModifierMap } from '@/components/rpg/quests/types';
import { CLASS_ARCHETYPE_SLUGS, CLASS_UNLOCK_POINTS } from '@/components/rpg/constants';

/** Title-case slug segments (matches `formatOrganicSlugForDisplay` for simple slugs). */
function displayLabelForSlug(slug: string): string {
  if (!slug) return '';
  const parts = slug.split(/[_-]+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/** Canonical `class:<slug>` score (post-migration modifiers). */
export function scoreClassArchetype(modifiers: ModifierMap, slug: string): number {
  return modifiers[`class:${slug}`] ?? 0;
}

/** Winner among archetypes with score ≥ threshold; tie-break: higher score, then slug lexicographic. */
export function pickDominantLockedSlug(modifiers: ModifierMap, threshold = CLASS_UNLOCK_POINTS): string | null {
  type Row = { slug: string; score: number };
  const unlocked: Row[] = [];
  for (const slug of CLASS_ARCHETYPE_SLUGS) {
    const score = scoreClassArchetype(modifiers, slug);
    if (score >= threshold) unlocked.push({ slug, score });
  }
  if (unlocked.length === 0) return null;
  unlocked.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  return unlocked[0]?.slug ?? null;
}

/** Strip every `class:*` except the locked slug (single-class rule). */
export function stripNonLockedClassModifiers(modifiers: ModifierMap, lockedSlug: string): ModifierMap {
  const next: ModifierMap = { ...modifiers };
  for (const key of Object.keys(next)) {
    if (!key.startsWith('class:')) continue;
    const slug = key.slice('class:'.length);
    if (slug !== lockedSlug) delete next[key];
  }
  return next;
}

export type ResolvedCharacterClass =
  | 'Warrior'
  | 'Rogue'
  | 'Mage'
  | 'Healer'
  | 'Ranger'
  | 'Stranger';

/** Archetype subtitle when any track ≥ unlock threshold (same tie-break as lock). */
export function getCharacterClass(modifiers: ModifierMap): ResolvedCharacterClass {
  const slug = pickDominantLockedSlug(modifiers, CLASS_UNLOCK_POINTS);
  if (!slug) return 'Stranger';
  return displayLabelForSlug(slug) as ResolvedCharacterClass;
}

export function displayLabelForClassSlug(slug: string): string {
  return displayLabelForSlug(slug);
}
