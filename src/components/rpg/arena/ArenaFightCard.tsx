import { characterStats } from '../constants';
import type { FighterSnapshot } from '../combat/combatTypes';
import { getSkillDisplayName } from '../combat/skillRegistry';
import { formatModifierKeyForCharacterSheet } from '../helpers';
import { RPG_UI_CAPTION, RPG_UI_META } from '../typography/rpgUiTypography';

type ArenaFightCardProps = {
  fighter: FighterSnapshot;
  currentHp?: number;
  sideLabel?: string;
};

export function ArenaFightCard({ fighter, currentHp, sideLabel }: ArenaFightCardProps) {
  const hp = currentHp ?? fighter.maxHp;
  const weapon = fighter.loadout.weapon
    ? formatModifierKeyForCharacterSheet(fighter.loadout.weapon)
    : '—';
  const other = fighter.loadout.other
    ? formatModifierKeyForCharacterSheet(fighter.loadout.other)
    : '—';
  const skillA = fighter.loadout.skillA ? getSkillDisplayName(fighter.loadout.skillA) : '—';
  const skillB = fighter.loadout.skillB ? getSkillDisplayName(fighter.loadout.skillB) : '—';

  return (
    <div className="min-w-0 flex-1 rounded border border-[var(--candle-rule)] bg-[var(--candle-paper)]/40 p-2">
      {sideLabel ? <p className={RPG_UI_META}>{sideLabel}</p> : null}
      <p className={`${RPG_UI_CAPTION} font-semibold text-[var(--candle-ink)]`}>{fighter.name}</p>
      <p className={RPG_UI_META}>
        Lv {fighter.level}
        {fighter.race ? ` · ${fighter.race}` : ''}
        {fighter.className ? ` ${fighter.className}` : ''}
      </p>
      <p className={RPG_UI_META}>
        HP {hp}/{fighter.maxHp}
      </p>
      <p className={RPG_UI_META}>
        {weapon} · {other}
      </p>
      <p className={RPG_UI_META}>
        {skillA} · {skillB}
      </p>
      <div className={`mt-1 grid grid-cols-3 gap-x-1 ${RPG_UI_META}`}>
        {characterStats.map((row) => {
          const label = row[0] as string;
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
          return (
            <span key={label}>
              {label.slice(0, 3)} {val}
            </span>
          );
        })}
      </div>
    </div>
  );
}
