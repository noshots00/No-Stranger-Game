/**
 * Stable pseudo-random assignments of batch WebP art to quests (by title) and races (by slug).
 * Uses a fixed seed so assets do not reshuffle on each page load.
 */

import { publicAsset } from '@/lib/publicAsset';
import { allQuests } from '@/components/rpg/quests/registry';
import { LEGACY_RACE_SLUG_REWRITES, RACES } from '@/components/rpg/races';
import type { QuestDefinition } from '@/components/rpg/quests/types';

/** Folder under `public/art/converted/` (no spaces — reliable on static hosts). */
const BATCH_SEGMENT = 'batch-2026-05-02_21-10-35';

const BATCH_PREFIX = `art/converted/${BATCH_SEGMENT}`;

/**
 * All `.webp` files in `public/art/converted/batch-2026-05-02_21-10-35/`.
 * Keep alphabetically sorted for a deterministic pre-shuffle order.
 */
const WEBP_FILENAMES: readonly string[] = [
  'adate-with-freja.webp',
  'atlantian-artist.webp',
  'atlantian-boy.webp',
  'atlantian-lovers.webp',
  'courting-atlantians.webp',
  'door-in-the-forest.webp',
  'dream-of-fae.webp',
  'elf-on-horse.webp',
  'forest-gnome-drinking-from-pond.webp',
  'forest-gnomes.webp',
  'gnomes-gathered.webp',
  'halfling-eating-in-the-field.webp',
  'her-pretty-boy.webp',
  'home.webp',
  'pleasant-forest.webp',
  'princess-atlantian.webp',
  'princess-dagas-wedding.webp',
  'river-kingdom-marching.webp',
  'slaying-the-snake.webp',
  'the-cyclops.webp',
  'the-dwarf-ogre.webp',
  'the-high-elfsanthe-night-elf.webp',
  'the-ogre-king.webp',
  'the-old-troll.webp',
  'the-princess-and-the-trolls.webp',
  'the-sun-prince.webp',
  'the-young-troll-on-the-cliff.webp',
  'troll.webp',
];

const SEED_STRING = 'no-stranger-game-art-Batch-2026-05-02_21-10-35';

function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — returns floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSeeded<T>(items: readonly T[], seedStr: string): T[] {
  const arr = [...items];
  const rnd = mulberry32(seedFromString(seedStr));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

const shuffledFilenames = shuffleSeeded(WEBP_FILENAMES, SEED_STRING);

/** Encode each path segment so special characters are safe in `img` src URLs. */
export function batchAsset(relativePathUnderPublic: string): string {
  const normalized = relativePathUnderPublic.replace(/^\/+/, '');
  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return publicAsset(encoded);
}

function fileAt(poolIndex: number): string {
  return shuffledFilenames[poolIndex % shuffledFilenames.length]!;
}

function buildQuestTitleMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < allQuests.length; i++) {
    const q = allQuests[i]!;
    map[q.title] = batchAsset(`${BATCH_PREFIX}/${fileAt(i)}`);
  }
  return map;
}

function buildRaceSlugMap(): Record<string, string> {
  const races = Object.values(RACES).sort((a, b) => a.slug.localeCompare(b.slug));
  const map: Record<string, string> = {};
  const start = allQuests.length;
  for (let j = 0; j < races.length; j++) {
    map[races[j]!.slug] = batchAsset(`${BATCH_PREFIX}/${fileAt(start + j)}`);
  }
  return map;
}

const QUEST_TITLE_TO_SRC = buildQuestTitleMap();
const RACE_SLUG_TO_SRC = buildRaceSlugMap();

const fallbackBatchPortraitSrc = batchAsset(`${BATCH_PREFIX}/${fileAt(0)}`);
const QUEST_TITLE_OVERRIDES: Record<string, string> = {
  'You find yourself in the forest.': batchAsset('art/To be converted/NSWoods.jpg'),
};
const genericQuestPlaceholderSrc = fallbackBatchPortraitSrc;

function firstAuthoredVisualImageSrc(quest: QuestDefinition): string | null {
  const beats = quest.stepVisuals?.[quest.startStepId];
  if (!beats || beats.length === 0) return null;
  for (const beat of beats) {
    if (beat.kind === 'image') {
      const src = beat.src.trim();
      if (src.length > 0) return batchAsset(src);
      continue;
    }
    if (beat.kind === 'image-row') {
      const first = beat.images.find((img) => img.src.trim().length > 0);
      if (first) return batchAsset(first.src);
    }
  }
  return null;
}

function firstAuthoredVisualImageSrcForStep(quest: QuestDefinition, stepId: string): string | null {
  const beats = quest.stepVisuals?.[stepId];
  if (!beats || beats.length === 0) return null;
  for (const beat of beats) {
    if (beat.kind === 'image') {
      const src = beat.src.trim();
      if (src.length > 0) return batchAsset(src);
      continue;
    }
    if (beat.kind === 'image-row') {
      const first = beat.images.find((img) => img.src.trim().length > 0);
      if (first) return batchAsset(first.src);
    }
  }
  return null;
}

/** Resolved URL for a quest illustration keyed by quest title (dialogue log lines use titles). */
export function getQuestImageSrcForTitle(title: string): string {
  if (QUEST_TITLE_OVERRIDES[title]) return QUEST_TITLE_OVERRIDES[title];
  return QUEST_TITLE_TO_SRC[title] ?? fallbackBatchPortraitSrc;
}

/** Card/Popup image source from quest-authored visuals with generic placeholder fallback. */
export function getQuestCardImageSrc(quest: QuestDefinition): string {
  return firstAuthoredVisualImageSrc(quest) ?? genericQuestPlaceholderSrc;
}

export function getGenericQuestPlaceholderSrc(): string {
  return genericQuestPlaceholderSrc;
}

/** Popup/inline image source from the current step visuals only; returns null if step has no image. */
export function getQuestStepImageSrc(quest: QuestDefinition, stepId: string): string | null {
  return firstAuthoredVisualImageSrcForStep(quest, stepId);
}

/** Location/NPC-style popup portrait — current step, then quest open beat, then card art. */
export function getQuestPopupPortraitSrc(quest: QuestDefinition, stepId: string): string {
  return (
    getQuestStepImageSrc(quest, stepId) ??
    getQuestStepImageSrc(quest, quest.startStepId) ??
    getQuestCardImageSrc(quest)
  );
}

/** Portrait URL for the character sheet from canonical race slug; falls back when unknown / no race. */
export function getRacePortraitSrc(slug: string | null | undefined): string {
  if (!slug) return fallbackBatchPortraitSrc;
  const normalized = LEGACY_RACE_SLUG_REWRITES[slug] ?? slug;
  return RACE_SLUG_TO_SRC[normalized] ?? fallbackBatchPortraitSrc;
}
