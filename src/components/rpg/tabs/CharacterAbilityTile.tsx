import { cn } from '@/lib/utils';
import type { CharacterAbilityTileData } from '../helpers';
import { CHAR_TILE_LEVEL, CHAR_TILE_NAME } from './characterSheetTypography';

type CharacterAbilityTileProps = {
  tile: CharacterAbilityTileData;
  className?: string;
};

/** Combat and spell slots: 1px vertical padding (2px taller than text). */
const TILE_CLASS =
  'inline-flex shrink-0 flex-col items-center justify-center rounded border bg-transparent px-1 py-px text-center font-serif leading-none';

export function CharacterAbilityTile({ tile, className }: CharacterAbilityTileProps) {
  return (
    <div
      className={cn(
        TILE_CLASS,
        tile.placeholder
          ? 'border-[var(--candle-rule)]/60 text-[var(--candle-ink-faint)]'
          : 'border-[var(--candle-flame-soft)]/35 text-[var(--candle-ink)]',
        className
      )}
      title={tile.placeholder ? `${tile.name} (placeholder)` : tile.name}
    >
      <span className={CHAR_TILE_NAME}>{tile.name}</span>
      <span className={CHAR_TILE_LEVEL}>Lv {tile.level}</span>
    </div>
  );
}
