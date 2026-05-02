import type { ModifierMap } from '@/components/rpg/quests/types';
import { PRIMARY_STAT_MODIFIER_LABEL } from '@/components/rpg/constants';

const ORGANIC_SUFFIX_RE = /^(?<stem>.+)(?<suffix>Class|Trait|Skill|Stat|Blessing|Race)$/u;

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
      return `skill:${slug}`;
    case 'Stat':
      return `stat:${slug}`;
    case 'Blessing':
      return `blessing:${slug}`;
    case 'Race':
      return `race:${slug}`;
    default:
      return key;
  }
}

/** Collapse deltas that map to the same canonical key (order-preserving sum). */
export function canonicalizeModifierMap(map: ModifierMap): ModifierMap {
  const next: ModifierMap = {};
  for (const [key, delta] of Object.entries(map)) {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) continue;
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

    next[canonical] = (next[canonical] ?? 0) + value;
  }
  return next;
}
