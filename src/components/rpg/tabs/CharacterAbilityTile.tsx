import { cn } from '@/lib/utils';
import type { CharacterAbilityTileData } from '../helpers';
import { itemNameClassName, itemNameColorStyle } from '../items/itemDisplay';
import { CHAR_LOADOUT_TILE_NAME, CHAR_TILE_LEVEL, CHAR_TILE_NAME } from './characterSheetTypography';

type CharacterAbilityTileProps = {
  tile: CharacterAbilityTileData;
  className?: string;
  /** Profile-card loadout row — smaller, single-line label. */
  compact?: boolean;
};

/** Combat and spell slots: 1px vertical padding (2px taller than text). */
const TILE_CLASS =
  'inline-flex shrink-0 flex-col items-center justify-center rounded bg-transparent px-1 py-px text-center font-serif leading-none';

const TILE_CLASS_COMPACT =
  'inline-flex shrink-0 flex-col items-center justify-center rounded bg-transparent px-0.5 py-0 text-center font-serif leading-none';

export function CharacterAbilityTile({ tile, className, compact = false }: CharacterAbilityTileProps) {
  const useItemColor = !tile.placeholder && tile.itemCategory;
  const labelColorClass = useItemColor
    ? undefined
    : cn(
        tile.accentClassName,
        className,
        !tile.accentClassName &&
          !className &&
          (tile.placeholder ? 'text-[var(--candle-ink-faint)]' : 'text-[var(--candle-ink)]')
      );

  return (
    <div
      className={compact ? TILE_CLASS_COMPACT : TILE_CLASS}
      title={tile.placeholder ? `${tile.name} (placeholder)` : tile.name}
    >
      <span
        className={cn(
          compact ? CHAR_LOADOUT_TILE_NAME : CHAR_TILE_NAME,
          useItemColor ? itemNameClassName(tile.itemCategory!) : labelColorClass
        )}
        style={useItemColor ? itemNameColorStyle(tile.itemCategory!) : undefined}
      >
        {tile.name}
      </span>
      {!tile.placeholder && tile.showLevel !== false ? (
        <span className={cn(CHAR_TILE_LEVEL, labelColorClass)}>Lv {tile.level}</span>
      ) : null}
    </div>
  );
}
