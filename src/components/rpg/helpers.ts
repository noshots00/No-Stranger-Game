import type { NostrEvent } from '@nostrify/nostrify';
import type { QuestState, DialogueLogEntry } from './quests/types';
import { getQuestContext, getSkillLevelUpLines, getVisibleQuests } from './quests/engine';
import { allQuests } from './quests/registry';
import { DAY_REPORT_SPEAKER } from './dialogueFormat';
import { parseQuestCheckpointPayload } from './gameProfile';
import {
  CLASS_UNLOCK_POINTS,
  COPPER_PER_GOLD,
  COPPER_PER_SILVER,
  CURRENCY_COPPER_KEY,
  GOLD_MODIFIER_KEYS,
  HIDDEN_CLASS_MODIFIER_KEYS,
  PRIMARY_STAT_MODIFIER_LABEL,
  QUEST_ORIGIN_ID,
  SKILL_MODIFIER_CATEGORY_LABEL,
  SKILL_MODIFIER_CATEGORY_ORDER,
} from './constants';

const PRIMARY_STAT_SLUGS = new Set(Object.values(PRIMARY_STAT_MODIFIER_LABEL));

/** Base score for each primary attribute before quest/race `stat:*` deltas. */
export const PRIMARY_STAT_SCORE_BASE = 1;

/** Total displayed score for one primary stat row (base + sum of `stat:<slug>` modifier). */
export function getPrimaryStatTotal(modifiers: Record<string, number>, statLabel: string): number {
  const slug = PRIMARY_STAT_MODIFIER_LABEL[statLabel];
  if (!slug) return PRIMARY_STAT_SCORE_BASE;
  const delta = modifiers[`stat:${slug}`] ?? 0;
  return PRIMARY_STAT_SCORE_BASE + delta;
}

/** True if this canonical key is one of the six primary attributes (main character sheet block). */
export function isPrimaryStatCanonicalKey(key: string): boolean {
  if (!key.startsWith('stat:')) return false;
  const slug = key.slice(5);
  return PRIMARY_STAT_SLUGS.has(slug);
}

const isHiddenClassModifierKey = (key: string): boolean =>
  (HIDDEN_CLASS_MODIFIER_KEYS as readonly string[]).includes(key);

/** Lowercase slug after `stat:` → legacy stat key (e.g. strength → Strength). */
const slugToPrimaryStatKey = (slug: string): string | undefined => {
  const entry = Object.entries(PRIMARY_STAT_MODIFIER_LABEL).find(([, v]) => v === slug);
  return entry?.[0];
};

/** Display word for primary stat gains (matches prior copy: "strength" not "Strength"). */
const primaryStatWordForKey = (key: string): string | null => {
  if (Object.prototype.hasOwnProperty.call(PRIMARY_STAT_MODIFIER_LABEL, key)) {
    return PRIMARY_STAT_MODIFIER_LABEL[key];
  }
  if (key.startsWith('stat:')) {
    const slug = key.slice(5);
    if (PRIMARY_STAT_SLUGS.has(slug)) return slug;
  }
  return null;
};

/** Title-case slug segments; underscores and hyphens become spaces (e.g. physical_attack → Physical Attack). */
export function formatOrganicSlugForDisplay(slug: string): string {
  if (!slug) return '';
  const parts = slug.split(/[_-]+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export type ModifierSheetBucket = 'stat' | 'trait' | 'skill' | 'class' | 'blessing' | 'misc';

export function getModifierSheetBucket(key: string): ModifierSheetBucket {
  if (key.startsWith('stat:')) return 'stat';
  if (key.startsWith('trait:')) return 'trait';
  if (key.startsWith('skill:')) return 'skill';
  if (key.startsWith('class:')) return 'class';
  if (key.startsWith('blessing:')) return 'blessing';
  return 'misc';
}

/** Parse `skill:bash` (legacy) vs `skill:combat:block` (categorized). */
export function parseSkillModifierKey(key: string): { category: string | null; skillSlug: string } | null {
  if (!key.startsWith('skill:')) return null;
  const rest = key.slice('skill:'.length);
  const idx = rest.indexOf(':');
  if (idx === -1) return { category: null, skillSlug: rest };
  return {
    category: rest.slice(0, idx),
    skillSlug: rest.slice(idx + 1),
  };
}

export function getSkillCategoryDisplayLabel(categoryKey: string): string {
  if (Object.prototype.hasOwnProperty.call(SKILL_MODIFIER_CATEGORY_LABEL, categoryKey)) {
    return SKILL_MODIFIER_CATEGORY_LABEL[categoryKey];
  }
  return formatOrganicSlugForDisplay(categoryKey);
}

export type SkillModifierGroup = { categoryKey: string; headingLabel: string; rows: [string, number][] };

/** Group `skill:*` modifiers for the character sheet (one section per category). */
export function groupSkillModifiersByCategory(entries: [string, number][]): SkillModifierGroup[] {
  const bucket = new Map<string, [string, number][]>();
  for (const row of entries) {
    const parsed = parseSkillModifierKey(row[0]);
    const ck = parsed?.category ?? 'general';
    if (!bucket.has(ck)) bucket.set(ck, []);
    bucket.get(ck)!.push(row);
  }

  const order = SKILL_MODIFIER_CATEGORY_ORDER;
  const keys = [...bucket.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return keys.map((categoryKey) => ({
    categoryKey,
    headingLabel: getSkillCategoryDisplayLabel(categoryKey),
    rows: bucket.get(categoryKey)!,
  }));
}

/** Short label for character sheet rows (canonical and legacy keys). */
export function formatModifierKeyForCharacterSheet(key: string): string {
  if (key.startsWith('stat:')) {
    const slug = key.slice(5);
    const legacy = slugToPrimaryStatKey(slug);
    if (legacy) return legacy;
  }
  if (key.startsWith('skill:')) {
    const parsed = parseSkillModifierKey(key);
    if (parsed) return formatOrganicSlugForDisplay(parsed.skillSlug);
  }
  if (key.startsWith('trait:') || key.startsWith('class:') || key.startsWith('blessing:')) {
    const slug = key.slice(key.indexOf(':') + 1);
    return formatOrganicSlugForDisplay(slug);
  }
  return key;
}

export function questStateHasRememberedName(state: QuestState): boolean {
  const name = state.playerName?.trim();
  if (!name) return false;
  if (state.flags.includes('quest001-complete')) return true;
  return Boolean(state.progressByQuestId[QUEST_ORIGIN_ID]?.isCompleted);
}

export function findFirstRememberedCheckpoint(
  events: NostrEvent[]
): { namedAt: number; displayName: string } | null {
  const sorted = [...events].sort((a, b) => a.created_at - b.created_at);
  for (const ev of sorted) {
    const payload = parseQuestCheckpointPayload(ev.content);
    if (!payload) continue;
    if (questStateHasRememberedName(payload.state)) {
      return { namedAt: ev.created_at, displayName: payload.state.playerName.trim() };
    }
  }
  return null;
}

export { appendUniqueWorldEntries } from './worldLog';

export const appendDialogue = (speaker: string, text: string): DialogueLogEntry => {
  const atMs = Date.now();
  return {
    id: `${speaker}-${atMs}-${Math.random().toString(36).slice(2, 8)}`,
    speaker,
    text,
    atMs,
  };
};

export const getCopperFromModifiers = (modifiers: Record<string, number>): number =>
  modifiers[CURRENCY_COPPER_KEY] ?? 0;

export type CoinSplit = { gold: number; silver: number; copper: number };

/** Split a copper total into gold/silver/copper. Negative totals split symmetrically. */
export function splitCopperIntoCoins(totalCopper: number): CoinSplit {
  const safe = Number.isFinite(totalCopper) ? Math.trunc(totalCopper) : 0;
  const sign = safe < 0 ? -1 : 1;
  const abs = Math.abs(safe);
  const gold = Math.floor(abs / COPPER_PER_GOLD);
  const remAfterGold = abs - gold * COPPER_PER_GOLD;
  const silver = Math.floor(remAfterGold / COPPER_PER_SILVER);
  const copper = remAfterGold - silver * COPPER_PER_SILVER;
  return { gold: sign * gold, silver: sign * silver, copper: sign * copper };
}

/** Compact coin display: "12g 5s 7c". Always shows all three slots so layout stays stable. */
export function formatCoinShort(split: CoinSplit): string {
  return `${split.gold}g ${split.silver}s ${split.copper}c`;
}

export const isItemModifierKey = (key: string): boolean => /^(item|items|inventory)[:_-]/i.test(key);

export type ModifierMessageKind =
  | 'hidden_class'
  | 'primary_stat'
  | 'organic_trait'
  | 'organic_skill'
  | 'organic_class'
  | 'organic_blessing'
  | 'other';

export const getModifierMessageKind = (key: string): ModifierMessageKind => {
  if (isHiddenClassModifierKey(key)) {
    return 'hidden_class';
  }
  const statWord = primaryStatWordForKey(key);
  if (statWord) {
    return 'primary_stat';
  }
  if (key.startsWith('trait:')) return 'organic_trait';
  if (key.startsWith('skill:')) return 'organic_skill';
  if (key.startsWith('class:')) return 'organic_class';
  if (key.startsWith('blessing:')) return 'organic_blessing';
  return 'other';
};

export const toItemLabel = (key: string): string =>
  key
    .replace(/^(item|items|inventory)[:_-]?/i, '')
    .replace(/[_-]/g, ' ')
    .trim() || 'supplies';

export const getRewardLines = (
  prevModifiers: Record<string, number>,
  nextModifiers: Record<string, number>
): string[] => {
  const rewardLines: string[] = [];
  const copperDelta = getCopperFromModifiers(nextModifiers) - getCopperFromModifiers(prevModifiers);
  if (copperDelta > 0) {
    rewardLines.push(`You gained ${formatCoinShort(splitCopperIntoCoins(copperDelta))}.`);
  }

  const itemLines = Object.keys(nextModifiers)
    .filter((key) => isItemModifierKey(key))
    .map((key) => {
      const previous = prevModifiers[key] ?? 0;
      const current = nextModifiers[key] ?? 0;
      const delta = current - previous;
      if (delta <= 0) return null;
      return `You found ${delta} ${toItemLabel(key)}.`;
    })
    .filter((line): line is string => Boolean(line));

  return [...rewardLines, ...itemLines];
};

const canonicalSlug = (key: string, prefix: string): string => {
  if (!key.startsWith(prefix)) return '';
  return key.slice(prefix.length);
};

export const getModifierLevelUpLines = (prevState: QuestState, nextState: QuestState): string[] => {
  const lines: string[] = [];

  Object.keys(nextState.modifiers).forEach((key) => {
    if (
      isItemModifierKey(key) ||
      key === CURRENCY_COPPER_KEY ||
      GOLD_MODIFIER_KEYS.includes(key as (typeof GOLD_MODIFIER_KEYS)[number])
    )
      return;
    const kind = getModifierMessageKind(key);
    if (kind === 'hidden_class') return;
    const previous = prevState.modifiers[key] ?? 0;
    const current = nextState.modifiers[key] ?? 0;
    const delta = current - previous;
    if (delta <= 0) return;

    if (kind === 'primary_stat') {
      const word = primaryStatWordForKey(key);
      if (word) lines.push(`You gain ${delta} ${word}!`);
      return;
    }

    if (kind === 'organic_trait') {
      const slug = canonicalSlug(key, 'trait:');
      lines.push(`You gain ${delta} ${formatOrganicSlugForDisplay(slug)} (trait).`);
      return;
    }
    if (kind === 'organic_skill') {
      const parsed = parseSkillModifierKey(key);
      const name = parsed ? formatOrganicSlugForDisplay(parsed.skillSlug) : formatOrganicSlugForDisplay(canonicalSlug(key, 'skill:'));
      if (parsed?.category) {
        const cat = getSkillCategoryDisplayLabel(parsed.category);
        lines.push(`You gain ${delta} ${name} (${cat} skill).`);
      } else {
        lines.push(`You gain ${delta} ${name} (skill).`);
      }
      return;
    }
    if (kind === 'organic_class') {
      const slug = canonicalSlug(key, 'class:');
      lines.push(`You gain ${delta} ${formatOrganicSlugForDisplay(slug)} (class).`);
      return;
    }
    if (kind === 'organic_blessing') {
      const slug = canonicalSlug(key, 'blessing:');
      lines.push(`You gain ${delta} ${formatOrganicSlugForDisplay(slug)} (blessing).`);
      return;
    }
  });

  return lines;
};

export const getLevelUpLines = (prevState: QuestState, nextState: QuestState): string[] => [
  ...getSkillLevelUpLines(prevState, nextState),
  ...getModifierLevelUpLines(prevState, nextState),
];

/** End-of-day summary lines for the main dialogue (title always; body when applicable). */
export function buildDayReportDialogueLines(
  prevDayNumber: number,
  prevState: QuestState,
  nextState: QuestState,
  currentDay: number
): DialogueLogEntry[] {
  const lines: DialogueLogEntry[] = [
    appendDialogue(DAY_REPORT_SPEAKER, `Day ${prevDayNumber} Report`),
  ];

  const xpDelta = nextState.experience - prevState.experience;
  if (xpDelta > 0) {
    lines.push(appendDialogue(DAY_REPORT_SPEAKER, `You gained ${xpDelta} experience.`));
  }

  for (const text of getRewardLines(prevState.modifiers, nextState.modifiers)) {
    lines.push(appendDialogue(DAY_REPORT_SPEAKER, text));
  }

  for (const text of getLevelUpLines(prevState, nextState)) {
    lines.push(appendDialogue(DAY_REPORT_SPEAKER, text));
  }

  const prevVisibleIds = new Set(
    getVisibleQuests(allQuests, getQuestContext(prevState, prevDayNumber)).map((q) => q.id)
  );
  const newlyVisible = getVisibleQuests(allQuests, getQuestContext(nextState, currentDay)).filter(
    (q) => !prevVisibleIds.has(q.id)
  );
  for (const quest of newlyVisible) {
    lines.push(appendDialogue(DAY_REPORT_SPEAKER, `A new quest awaits: ${quest.title}.`));
  }

  return lines;
};

export const getCharacterClass = (modifiers: Record<string, number>): 'Warrior' | 'Rogue' | 'Mage' | 'Stranger' => {
  const classScores: Array<{ name: 'Warrior' | 'Rogue' | 'Mage'; score: number }> = [
    { name: 'Warrior', score: modifiers.WarriorClass ?? modifiers['class:warrior'] ?? 0 },
    { name: 'Rogue', score: modifiers.RogueClass ?? modifiers['class:rogue'] ?? 0 },
    { name: 'Mage', score: modifiers.MageClass ?? modifiers['class:mage'] ?? 0 },
  ];

  const unlocked = classScores.filter((entry) => entry.score >= CLASS_UNLOCK_POINTS);
  if (unlocked.length === 0) return 'Stranger';
  return unlocked.sort((a, b) => b.score - a.score)[0].name;
};
