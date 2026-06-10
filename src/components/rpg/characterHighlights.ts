import { cn } from '@/lib/utils';

export type PlayerNameHighlightVariant = '1' | '2' | '3';
export type LevelHighlightVariant = '1' | '2' | '3';

/** Shipped highlight styles (dev panel compares alternates). */
export const SHIPPED_PLAYER_NAME_VARIANT: PlayerNameHighlightVariant = '3';
export const SHIPPED_LEVEL_VARIANT: LevelHighlightVariant = '3';

export const PLAYER_NAME_HIGHLIGHT_VARIANTS: readonly PlayerNameHighlightVariant[] = ['1', '2', '3'];
export const LEVEL_HIGHLIGHT_VARIANTS: readonly LevelHighlightVariant[] = ['1', '2', '3'];

export type HighlightVariantMeta = {
  title: string;
  blurb: string;
};

export const PLAYER_NAME_VARIANT_META: Record<PlayerNameHighlightVariant, HighlightVariantMeta> = {
  '1': {
    title: 'Gold',
    blurb: 'Same weight as body — wax gold only.',
  },
  '2': {
    title: 'Gold + rule',
    blurb: 'Same weight — gold text with a thin wax underline.',
  },
  '3': {
    title: 'Pale gold',
    blurb: 'Same weight — lighter champagne gold. Shipped (matches level).',
  },
};

export const LEVEL_VARIANT_META: Record<LevelHighlightVariant, HighlightVariantMeta> = {
  '1': {
    title: 'Flame gold',
    blurb: 'Same weight as body — warmer orange-gold.',
  },
  '2': {
    title: 'Wax gold',
    blurb: 'Same weight as body — candle wax gold.',
  },
  '3': {
    title: 'Pale gold',
    blurb: 'Same weight — lighter champagne gold. Shipped (matches name).',
  },
};

export function playerNameMarkClass(
  variant: PlayerNameHighlightVariant = SHIPPED_PLAYER_NAME_VARIANT
): string {
  return cn('player-name-mark', `player-name-mark--${variant}`);
}

export function levelGlintMarkClass(
  variant: LevelHighlightVariant = SHIPPED_LEVEL_VARIANT,
  highlighted: boolean
): string {
  return cn(
    'level-glint-mark',
    `level-glint-mark--${variant}`,
    highlighted && 'level-glint-mark--highlighted'
  );
}
