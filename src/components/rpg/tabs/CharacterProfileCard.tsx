import { CoinAmountDisplay } from '../CoinAmountDisplay';
import type { CoinSplit } from '../helpers';
import { getRacePortraitSrc } from '../rpgArtAssignments';
import type { QuestState } from '../quests/types';
import type { CombatLoadout } from '../combat/combatTypes';
import { CharacterLoadoutSlots } from './CharacterLoadoutSlots';
import { PrimaryStatsInline } from './PrimaryStatsInline';
import {
  CHAR_META_FAINT,
  CHAR_META_LABEL,
  CHAR_META_VALUE,
  CHAR_PROFILE_HEADER,
  CHAR_PROFILE_META,
  CHAR_PROFILE_NAME,
  CHAR_PROFILE_SUBTITLE,
} from './characterSheetTypography';

/** Shared width for profile card + aligned skill row (character tab + player popup). */
export const CHARACTER_PROFILE_CARD_SHELL =
  'mx-auto w-full max-w-[17.5rem] min-w-0';

type CharacterProfileCardProps = {
  questState: QuestState;
  ageLabel: string;
  guildDisplayName: string;
  characterLevel: number;
  raceMiddle: string;
  characterClass: string;
  raceEmoji: string;
  jobLine: string;
  coinSplit: CoinSplit;
  kindredSpirits?: number;
  userPubkey: string | undefined;
  onLoadoutChange: (loadout: CombatLoadout) => void;
};

/**
 * Compact player summary — portrait + identity + stats + loadout.
 * Age/guild on one line; name, subtitle, stats, and meta centered.
 */
export function CharacterProfileCard({
  questState,
  ageLabel,
  guildDisplayName,
  characterLevel,
  raceMiddle,
  characterClass,
  raceEmoji,
  jobLine,
  coinSplit,
  kindredSpirits,
  userPubkey,
  onLoadoutChange,
}: CharacterProfileCardProps) {
  return (
    <div
      className="character-profile-card grid w-full min-w-0 gap-x-1.5 gap-y-0.5 rounded-md border border-[var(--candle-flame-soft)] p-1"
      style={{ gridTemplateColumns: '4.5rem minmax(0, 1fr)' }}
    >
      <img
        src={getRacePortraitSrc(questState.assignedRaceSlug)}
        alt="Character portrait"
        className="col-start-1 row-start-1 row-span-5 aspect-[200/266] w-full self-start rounded-md object-cover shadow-[0_8px_24px_rgba(0,0,0,0.4)] ring-1 ring-[var(--candle-rule)]"
      />

      <div
        className={`col-start-2 row-start-1 flex min-w-0 items-baseline justify-between gap-1 ${CHAR_PROFILE_HEADER}`}
      >
        <p className={`min-w-0 leading-tight ${CHAR_META_VALUE}`}>{ageLabel}</p>
        <p className="shrink-0 text-right leading-tight text-[var(--rpg-guild-label)]">
          {guildDisplayName}
        </p>
      </div>

      <p className={`col-start-2 row-start-2 min-w-0 break-words text-center ${CHAR_PROFILE_NAME}`}>
        {questState.playerName || 'Stranger'}
      </p>

      <p className={`col-start-2 row-start-3 min-w-0 break-words text-center ${CHAR_PROFILE_SUBTITLE}`}>
        {raceEmoji ? (
          <span aria-hidden="true">
            {raceEmoji}{' '}
          </span>
        ) : null}
        Level {characterLevel} {raceMiddle} {characterClass}
      </p>

      <PrimaryStatsInline questState={questState} className="col-start-2 row-start-4 min-w-0" />

      <div className={`col-start-2 row-start-5 min-w-0 text-center ${CHAR_PROFILE_META}`}>
        <p className={`block leading-tight ${CHAR_META_VALUE}`}>{jobLine}</p>
        <p className="block leading-tight">
          <span className={CHAR_META_LABEL}>Coin: </span>
          <CoinAmountDisplay split={coinSplit} />
        </p>
        <p className="block leading-tight">
          <span className={CHAR_META_LABEL}>Kindred: </span>
          {userPubkey != null && kindredSpirits !== undefined ? (
            <span className={`font-mono ${CHAR_META_VALUE}`}>{kindredSpirits}</span>
          ) : (
            <span className={CHAR_META_FAINT}>—</span>
          )}
        </p>
      </div>

      <div className="col-span-2 row-start-6 min-w-0 border-t border-[var(--candle-rule)]/25 pt-0.5">
        <CharacterLoadoutSlots spread questState={questState} onLoadoutChange={onLoadoutChange} />
      </div>
    </div>
  );
}
