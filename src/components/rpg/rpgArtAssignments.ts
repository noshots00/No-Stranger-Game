/**
 * Stable pseudo-random assignments of batch WebP art to quests (by title) and races (by slug).
 * Uses a fixed seed so assets do not reshuffle on each page load.
 */

import { publicAsset } from '@/lib/publicAsset';
import { VILLAGE_MAP_PATH } from '@/components/rpg/village/villageArt';
import { allQuests } from '@/components/rpg/quests/registry';
import { LEGACY_RACE_SLUG_REWRITES, RACES } from '@/components/rpg/races';
import { resolveQuestEntryStepId } from '@/components/rpg/quests/engine';
import type { QuestDefinition, QuestImageFit, QuestState, QuestStep, QuestVisualBeat } from '@/components/rpg/quests/types';

/** Flat converted art under `public/art/converted/` (no batch subfolders). */
const CONVERTED_ART = 'art/converted';

/**
 * Core portrait pool — files at `public/art/converted/<name>.webp`.
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
    map[q.title] = batchAsset(`${CONVERTED_ART}/${fileAt(i)}`);
  }
  return map;
}

function buildRaceSlugMap(): Record<string, string> {
  const races = Object.values(RACES).sort((a, b) => a.slug.localeCompare(b.slug));
  const map: Record<string, string> = {};
  const start = allQuests.length;
  for (let j = 0; j < races.length; j++) {
    map[races[j]!.slug] = batchAsset(`${CONVERTED_ART}/${fileAt(start + j)}`);
  }
  return map;
}

const QUEST_TITLE_TO_SRC = buildQuestTitleMap();
const RACE_SLUG_TO_SRC = buildRaceSlugMap();

const fallbackBatchPortraitSrc = batchAsset(`${CONVERTED_ART}/${fileAt(0)}`);

type QuestTitleArtOverride = {
  path: string;
  fit?: QuestImageFit;
};

const QUEST_TITLE_ART_OVERRIDES: Record<string, QuestTitleArtOverride> = {
  'You find yourself in the forest.': { path: `${CONVERTED_ART}/nswoods.webp` },
  Instinct: {
    path: `${CONVERTED_ART}/aerial-view-of-autumn-forest-colors.webp`,
  },
  'Equip a weapon and a skill': {
    path: `${CONVERTED_ART}/aerial-view-of-autumn-forest-colors.webp`,
  },
  Sunset: {
    path: `${CONVERTED_ART}/sophus-jacobsen-sunset-in-the-forest-1878.webp`,
  },
  'Another Strange Day': {
    path: `${CONVERTED_ART}/mushrooms.webp`,
  },
  'Abandoned Shelter': { path: `${CONVERTED_ART}/a-hut-richard-bergholz.webp` },
  'The Cave': { path: `${CONVERTED_ART}/courbet-forest-cave-c-1865-o-773.webp` },
};

function questTitleArtOverride(title: string): QuestTitleArtOverride | null {
  return QUEST_TITLE_ART_OVERRIDES[title] ?? null;
}

const genericQuestPlaceholderSrc = fallbackBatchPortraitSrc;

function firstAuthoredImageBeatForStep(
  quest: QuestDefinition,
  stepId: string
): Extract<QuestVisualBeat, { kind: 'image' }> | null {
  const beats = quest.stepVisuals?.[stepId];
  if (!beats || beats.length === 0) return null;
  for (const beat of beats) {
    if (beat.kind === 'image') {
      const src = beat.src.trim();
      if (src.length > 0) return beat;
    }
  }
  return null;
}

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

function firstAuthoredVisualImageSrcAnyStep(quest: QuestDefinition): string | null {
  if (!quest.stepVisuals) return null;
  for (const beats of Object.values(quest.stepVisuals)) {
    if (!beats || beats.length === 0) continue;
    for (const beat of beats) {
      if (beat.kind === 'image') {
        const src = beat.src.trim();
        if (src.length > 0) return batchAsset(src);
      }
      if (beat.kind === 'image-row') {
        const first = beat.images.find((img) => img.src.trim().length > 0);
        if (first) return batchAsset(first.src);
      }
    }
  }
  return null;
}

/** Resolved URL for a quest illustration keyed by quest title (dialogue log lines use titles). */
export function getQuestImageSrcForTitle(title: string): string {
  const override = questTitleArtOverride(title);
  if (override) return batchAsset(override.path);
  return QUEST_TITLE_TO_SRC[title] ?? fallbackBatchPortraitSrc;
}

function entryStepArtFromFlags(quest: QuestDefinition, playerFlags?: readonly string[]): string | null {
  if (!playerFlags || !quest.resolveInitialStepId) return null;
  const stepId = resolveQuestEntryStepId(quest, { flags: [...playerFlags] } as QuestState);
  return firstAuthoredVisualImageSrcForStep(quest, stepId);
}

/** Card/Popup image source — branch entry art, title override, then start-step art, then any step art. */
export function getQuestCardImageSrc(
  quest: QuestDefinition,
  playerFlags?: readonly string[]
): string {
  const entryArt = entryStepArtFromFlags(quest, playerFlags);
  if (entryArt) return entryArt;
  const override = questTitleArtOverride(quest.title);
  if (override) return batchAsset(override.path);
  return (
    firstAuthoredVisualImageSrc(quest) ??
    firstAuthoredVisualImageSrcAnyStep(quest) ??
    genericQuestPlaceholderSrc
  );
}

/** Letterbox vs crop for quest card / scene background art. */
export function getQuestCardImageFit(quest: QuestDefinition): QuestImageFit {
  const override = questTitleArtOverride(quest.title);
  if (override?.fit) return override.fit;
  return (
    firstAuthoredImageBeatForStep(quest, quest.startStepId)?.fit ??
    'cover'
  );
}

export function getGenericQuestPlaceholderSrc(): string {
  return genericQuestPlaceholderSrc;
}

/** Popup/inline image source from the current step visuals only; returns null if step has no image. */
export function getQuestStepImageSrc(quest: QuestDefinition, stepId: string): string | null {
  return firstAuthoredVisualImageSrcForStep(quest, stepId);
}

/** Letterbox vs portrait crop for step art (`contain` keeps wide images uncropped). */
export function getQuestStepImageFit(quest: QuestDefinition, stepId: string): QuestImageFit {
  const stepBeat = firstAuthoredImageBeatForStep(quest, stepId);
  if (stepBeat?.fit) return stepBeat.fit;
  const startBeat = firstAuthoredImageBeatForStep(quest, quest.startStepId);
  if (startBeat?.fit) return startBeat.fit;
  if (!firstAuthoredVisualImageSrcForStep(quest, stepId)) {
    return getQuestCardImageFit(quest);
  }
  return 'cover';
}

/** Location/NPC-style popup portrait — current step, then quest open beat, then card art. */
export function getQuestPopupPortraitSrc(quest: QuestDefinition, stepId: string): string {
  return (
    getQuestStepImageSrc(quest, stepId) ??
    getQuestStepImageSrc(quest, quest.startStepId) ??
    getQuestCardImageSrc(quest)
  );
}

/** Quest-scene NPC portraits (step `npcTalkId` → art). */
export const NPC_PORTRAIT_BY_ID: Record<string, string> = {
  carl: publicAsset(`${CONVERTED_ART}/atlantian-artist.webp`),
  shannon: publicAsset(`${CONVERTED_ART}/wa195531.webp`),
  trainer: publicAsset(`${CONVERTED_ART}/river-kingdom-marching.webp`),
  skeleton: publicAsset(`${CONVERTED_ART}/skeleton2.webp`),
};

/** Hero background for NPC talk scenes (portrait uses `NPC_PORTRAIT_BY_ID`). */
export const NPC_TALK_BACKGROUND_BY_ID: Record<string, string> = {
  shannon: batchAsset(VILLAGE_MAP_PATH),
  trainer: publicAsset(`${CONVERTED_ART}/ancient-war.webp`),
  skeleton: publicAsset(`${CONVERTED_ART}/skeleton2.webp`),
};

export function getNpcPortraitSrc(npcTalkId: string): string {
  return NPC_PORTRAIT_BY_ID[npcTalkId] ?? fallbackBatchPortraitSrc;
}

export function getNpcTalkBackgroundSrc(
  npcTalkId: string,
  quest: QuestDefinition,
  stepId: string
): string {
  return NPC_TALK_BACKGROUND_BY_ID[npcTalkId] ?? getQuestPopupPortraitSrc(quest, stepId);
}

/** Quest scene portrait — NPC talk id wins; else step/start/card art chain. */
export function getQuestScenePortraitSrc(quest: QuestDefinition, step: QuestStep): string {
  if (step.npcTalkId) return getNpcPortraitSrc(step.npcTalkId);
  return getQuestPopupPortraitSrc(quest, step.id);
}

export function getQuestScenePortraitAlt(quest: QuestDefinition, step: QuestStep): string {
  if (step.npcTalkId === 'carl') return 'Carl';
  if (step.npcTalkId === 'shannon') return 'Shannon';
  if (step.npcTalkId === 'skeleton') return 'Living skeleton';
  return `${quest.title} scene`;
}

/** Portrait URL for the character sheet from canonical race slug; falls back when unknown / no race. */
export function getRacePortraitSrc(slug: string | null | undefined): string {
  if (!slug) return fallbackBatchPortraitSrc;
  const normalized = LEGACY_RACE_SLUG_REWRITES[slug] ?? slug;
  return RACE_SLUG_TO_SRC[normalized] ?? fallbackBatchPortraitSrc;
}
