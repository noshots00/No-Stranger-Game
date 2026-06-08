import { cn } from '@/lib/utils';
import { characterStats } from '../constants';
import type { FighterSnapshot } from '../combat/combatTypes';
import { getSkillDisplayName } from '../combat/skillRegistry';
import { formatFighterIdentitySubtitle } from './arenaDisplay';

type ArenaFightCardProps = {
  fighter: FighterSnapshot;
  currentHp?: number;
  className?: string;
  /** Small status chip shown on queue cards. */
  queueStatus?: 'waiting';
};

function formatLoadoutLine(fighter: FighterSnapshot): string {
  const parts = [
    fighter.loadout.weapon
      ? formatModifierKeyForCharacterSheet(fighter.loadout.weapon)
      : null,
    fighter.loadout.other ? formatModifierKeyForCharacterSheet(fighter.loadout.other) : null,
    fighter.loadout.skillA ? getSkillDisplayName(fighter.loadout.skillA) : null,
    fighter.loadout.skillB ? getSkillDisplayName(fighter.loadout.skillB) : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Unarmed';
}

function formatStatLine(fighter: FighterSnapshot): string {
  return characterStats
    .map((row) => {
      const label = row[0] as string;
      const key = label.slice(0, 3).toUpperCase();
      const val =
        label === 'Strength'
          ? fighter.stats.str
          : label === 'Dexterity'
            ? fighter.stats.dex
            : label === 'Constitution'
              ? fighter.stats.con
              : label === 'Intelligence'
                ? fighter.stats.int
                : label === 'Wisdom'
                  ? fighter.stats.wis
                  : fighter.stats.cha;
      return `${key} ${val}`;
    })
    .join(' · ');
}

export function ArenaFightCard({ fighter, currentHp, className, queueStatus }: ArenaFightCardProps) {
  const hp = currentHp ?? fighter.maxHp;
  const identityMeta = formatFighterIdentitySubtitle(fighter);

  return (
    <div
      className={cn(
        'relative min-w-0 rounded-sm bg-gradient-to-br from-black/35 via-black/20 to-[var(--candle-flame)]/[0.07] px-2 py-1',
        queueStatus === 'waiting' && 'pr-[7.5rem]',
        className
      )}
    >
      {queueStatus === 'waiting' ? (
        <span className="absolute right-1.5 top-1 max-w-[7rem] text-right rpg-font-ui text-[9px] leading-tight tracking-[0.06em] text-emerald-400/95">
          Waiting for opponent
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="min-w-0 truncate leading-tight">
          <span className="rpg-display text-[14px] text-[var(--candle-wax)]">{fighter.name}</span>
          {identityMeta ? (
            <>
              <span className="text-[var(--candle-ink-faint)]"> · </span>
              <span className="rpg-font-ui text-[13px] text-[var(--candle-ink-soft)]">{identityMeta}</span>
            </>
          ) : null}
        </p>
      </div>

      <p className="rpg-font-ui mt-0.5 truncate text-[10px] leading-tight tracking-wide text-[var(--candle-ink-faint)]">
        <span className="font-medium tabular-nums text-[var(--candle-flame-soft)]">
          {hp}/{fighter.maxHp}
        </span>
        <span> · {formatStatLine(fighter)}</span>
      </p>

      <p className="rpg-font-ui truncate text-[10px] leading-tight text-[var(--candle-ink-soft)]">
        {formatLoadoutLine(fighter)}
      </p>
    </div>
  );
}
