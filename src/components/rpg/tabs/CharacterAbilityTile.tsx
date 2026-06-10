import { cn } from '@/lib/utils';
import type { CharacterAbilityTileData } from '../helpers';
import { itemNameClassName, itemNameColorStyle } from '../items/itemDisplay';
import { CHAR_TILE_LEVEL, CHAR_TILE_NAME } from './characterSheetTypography';

type CharacterAbilityTileProps = {
  tile: CharacterAbilityTileData;
  className?: string;
};

/** Combat and spell slots: 1px vertical padding (2px taller than text). */
const TILE_CLASS =
  'inline-flex shrink-0 flex-col items-center justify-center rounded bg-transparent px-1 py-px text-center font-serif leading-none';

export function CharacterAbilityTile({ tile, className }: CharacterAbilityTileProps) {
  return (
    <div
      className={cn(
        TILE_CLASS,
        !className &&
          (tile.placeholder ? 'text-[var(--candle-ink-faint)]' : 'text-[var(--candle-ink)]'),
        className
      )}
      title={tile.placeholder ? `${tile.name} (placeholder)` : tile.name}
    >
      <span
        className={cn(
          CHAR_TILE_NAME,
          !tile.placeholder && tile.itemCategory ? itemNameClassName(tile.itemCategory) : null
        )}
        style={!tile.placeholder && tile.itemCategory ? itemNameColorStyle(tile.itemCategory) : undefined}
      >
        {tile.name}
      </span>
      {!tile.placeholder ? <span className={CHAR_TILE_LEVEL}>Lv {tile.level}</span> : null}
    </div>
  );
}
