import type { ModifierMap } from '@/components/rpg/quests/types';
import {
  COIN_AUTHORING_KEY_VALUE,
  CURRENCY_COPPER_KEY,
  PRIMARY_STAT_MODIFIER_LABEL,
} from '@/components/rpg/constants';
import { LEGACY_RACE_SLUG_REWRITES } from '@/components/rpg/races';

const ORGANIC_SUFFIX_RE = /^(?<stem>.+)(?<suffix>Class|Trait|Skill|Stat|Blessing|Race)$/u;

/** `Category_NameSkill` → `skill:category:name`; plain `BashSkill` → `skill:bash`. */
function canonicalSkillKeyFromStem(stem: string): string {
  const us = stem.indexOf('_');
  if (us <= 0) {
    return `skill:${stem.toLowerCase()}`;
  }
  const category = stem.slice(0, us).toLowerCase();
  const rest = stem.slice(us + 1);
  const skillSlug = rest
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .split('_')
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .join('_');
  return `skill:${category}:${skillSlug}`;
}

/** Apply legacy slug rewrites; e.g. `river_kingdom` -> `riverkingdom`. */
const rewriteRaceSlug = (slug: string): string => LEGACY_RACE_SLUG_REWRITES[slug] ?? slug;

/** If `key` is a coin authoring key (Copper/Silver/Gold/Coins, any case), return the copper value of `delta`. */
const tryFoldCoinKey = (key: string, delta: number): number | null => {
  const value = COIN_AUTHORING_KEY_VALUE[key.toLowerCase()];
  return value ? delta * value : null;
};

/** Maps handwritten quest keys (e.g. WarriorClass, CourageTrait) to stable storage keys. */
export function canonicalizeModifierKey(key: string): string {
  const m = key.match(ORGANIC_SUFFIX_RE);
  const stem = m?.groups?.stem;
  const suffix = m?.groups?.suffix;
  if (!stem || !suffix) return key;

  const slug = stem.toLowerCase();
  switch (suffix) {
    case 'Class':
      return `class:${slug}`;
    case 'Trait':
      return `trait:${slug}`;
    case 'Skill':
      return canonicalSkillKeyFromStem(stem);
    case 'Stat':
      return `stat:${slug}`;
    case 'Blessing':
      return `blessing:${slug}`;
    case 'Race':
      return `race:${rewriteRaceSlug(slug)}`;
    default:
      return key;
  }
}

/** Collapse deltas that map to the same canonical key (order-preserving sum). */
export function canonicalizeModifierMap(map: ModifierMap): ModifierMap {
  const next: ModifierMap = {};
  for (const [key, delta] of Object.entries(map)) {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) continue;
    const copperDelta = tryFoldCoinKey(key, delta);
    if (copperDelta !== null) {
      next[CURRENCY_COPPER_KEY] = (next[CURRENCY_COPPER_KEY] ?? 0) + copperDelta;
      continue;
    }
    const ck = canonicalizeModifierKey(key);
    next[ck] = (next[ck] ?? 0) + delta;
  }
  return next;
}

/** Rewrite persisted modifier maps: organic suffixes, legacy stat names, legacy class keys → canonical. */
export function migrateModifiersToCanonical(map: ModifierMap): ModifierMap {
  const next: ModifierMap = {};
  for (const [key, value] of Object.entries(map)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;

    const copperValue = tryFoldCoinKey(key, value);
    if (copperValue !== null) {
      next[CURRENCY_COPPER_KEY] = (next[CURRENCY_COPPER_KEY] ?? 0) + copperValue;
      continue;
    }

    let canonical = canonicalizeModifierKey(key);
    if (canonical === key) {
      if (Object.prototype.hasOwnProperty.call(PRIMARY_STAT_MODIFIER_LABEL, key)) {
        canonical = `stat:${key.toLowerCase()}`;
      } else if (
        key.startsWith('class:') ||
        key.startsWith('trait:') ||
        key.startsWith('skill:') ||
        key.startsWith('stat:') ||
        key.startsWith('blessing:') ||
        key.startsWith('race:')
      ) {
        canonical = key;
      }
    }

    if (canonical.startsWith('race:')) {
      const slug = canonical.slice('race:'.length);
      canonical = `race:${rewriteRaceSlug(slug)}`;
    }

    next[canonical] = (next[canonical] ?? 0) + value;
  }
  return next;
}
