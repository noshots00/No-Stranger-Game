import { characterStats } from '../constants';
import { getPrimaryStatAbbrev, getPrimaryStatTotal } from '../helpers';
import type { QuestState } from '../quests/types';
import { CHAR_STAT_CELL, CHAR_STAT_LABEL, CHAR_STAT_TABLE, CHAR_STAT_VALUE } from './characterSheetTypography';

type PrimaryStatsInlineProps = {
  questState: QuestState;
  className?: string;
};

/** Single-row STR/DEX/… strip for profile card. */
export function PrimaryStatsInline({ questState, className }: PrimaryStatsInlineProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-1 gap-y-0 ${CHAR_STAT_TABLE}${className ? ` ${className}` : ''}`}
      aria-label="Primary attributes"
    >
      {characterStats.map((cell) => (
        <div key={cell[0]} className={CHAR_STAT_CELL}>
          <span className={CHAR_STAT_LABEL}>{getPrimaryStatAbbrev(cell[0])}</span>
          <span className={CHAR_STAT_VALUE}>{getPrimaryStatTotal(questState.modifiers, cell[0])}</span>
        </div>
      ))}
    </div>
  );
}
