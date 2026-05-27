import type { CharacterAbilityTileData } from '../helpers';
import { CharacterAbilityTile } from './CharacterAbilityTile';
import { ABILITY_TILES_PER_ROW } from './characterSheetPlaceholders';

function chunkTiles<T>(tiles: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < tiles.length; i += perRow) {
    rows.push(tiles.slice(i, i + perRow));
  }
  return rows;
}

type CharacterAbilityTileGridProps = {
  tiles: CharacterAbilityTileData[];
  /** Accessible name for the tile group. */
  label: string;
};

/** Renders ability tiles in rows of five; additional rows when count exceeds five. */
export function CharacterAbilityTileGrid({ tiles, label }: CharacterAbilityTileGridProps) {
  if (tiles.length === 0) return null;

  const rows = chunkTiles(tiles, ABILITY_TILES_PER_ROW);

  return (
    <div className="space-y-1" aria-label={label}>
      {rows.map((row, rowIdx) => (
        <div key={`${label}-row-${rowIdx}`} className="flex w-full justify-center gap-1">
          {row.map((tile) => (
            <CharacterAbilityTile key={tile.id} tile={tile} />
          ))}
        </div>
      ))}
    </div>
  );
}
