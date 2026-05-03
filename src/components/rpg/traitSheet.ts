import { CLASS_UNLOCK_POINTS } from './constants';
import { formatOrganicSlugForDisplay } from './helpers';

/** Trained trait slug (after `trait:`) → sheet title when points ≥ threshold. */
const TRAIT_TITLE_BY_SLUG: Record<string, string> = {
  courage: 'Courageous',
  coward: 'Cowardly',
  cautious: 'Cautious',
  temperance: 'Temperate',
  proud: 'Proud',
  competitive: 'Competitive',
  resilient: 'Resilient',
  spiritual: 'Spiritual',
  diplomatic: 'Diplomatic',
  adaptable: 'Adaptable',
  secretive: 'Secretive',
  vengeful: 'Vengeful',
  arrogant: 'Arrogant',
  studious: 'Studious',
  natureloving: 'Nature-loving',
  stubborn: 'Stubborn',
  hardworking: 'Hardworking',
  curious: 'Curious',
  witty: 'Witty',
  cheerful: 'Cheerful',
  furious: 'Furious',
  brutish: 'Brutish',
  sneaky: 'Sneaky',
  graceful: 'Graceful',
  prideful: 'Prideful',
  foolhardy: 'Foolhardy',
};

export function traitDisplayTitleForSlug(slug: string): string {
  const key = slug.toLowerCase();
  return TRAIT_TITLE_BY_SLUG[key] ?? formatOrganicSlugForDisplay(slug);
}

/** Comma-separated unlocked trait titles, or null if none ≥ threshold. */
export function formatUnlockedTraitsLine(
  rows: [string, number][],
  threshold = CLASS_UNLOCK_POINTS
): string | null {
  const titles = rows
    .filter(([, v]) => v >= threshold)
    .map(([key]) => {
      const slug = key.startsWith('trait:') ? key.slice('trait:'.length) : key;
      return traitDisplayTitleForSlug(slug);
    });
  if (titles.length === 0) return null;
  return titles.join(', ');
}
