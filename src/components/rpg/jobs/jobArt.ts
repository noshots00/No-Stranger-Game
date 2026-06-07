import { publicAsset } from '@/lib/publicAsset';
import {
  JOB_SLUG_ADVENTURER,
  JOB_SLUG_EXPLORER,
  JOB_SLUG_MINER,
  JOB_SLUG_STONECUTTER,
  JOB_SLUG_WOODCUTTER,
} from '../constants';

/** Curated profession card art under `public/art/converted/`. */
const JOB_SLUG_TO_ART_PATH: Record<string, string> = {
  [JOB_SLUG_EXPLORER]: 'art/converted/door-in-the-forest.webp',
  [JOB_SLUG_ADVENTURER]: 'art/converted/river-kingdom-marching.webp',
  [JOB_SLUG_STONECUTTER]: 'art/converted/outcropping.webp',
  [JOB_SLUG_MINER]: 'art/converted/dark-mountains.webp',
  [JOB_SLUG_WOODCUTTER]: 'art/converted/maine-woods.webp',
};

const FALLBACK_ART_PATH = 'art/converted/pleasant-forest.webp';

export function getJobCardImageSrc(jobSlug: string): string {
  const path = JOB_SLUG_TO_ART_PATH[jobSlug] ?? FALLBACK_ART_PATH;
  return publicAsset(path);
}
