import { Fragment, type ReactNode } from 'react';
import { SKILL_SHEET_LABEL, SKILL_XP_KEYS } from '../quests/skills-config';
import { getCharacterLevel, getLevelFromXp } from '../quests/engine';
import {
  formatCoinShort,
  formatModifierKeyForCharacterSheet,
  formatOrganicSlugForDisplay,
  getCharacterClass,
  getCopperFromModifiers,
  getModifierMessageKind,
  getModifierSheetBucket,
  getPrimaryStatTotal,
  groupSkillModifiersByCategory,
  isPrimaryStatCanonicalKey,
  splitCopperIntoCoins,
} from '../helpers';
import { characterStats } from '../constants';
import type { QuestState } from '../quests/types';
import type { ModifierSheetBucket } from '../helpers';
import { publicAsset } from '@/lib/publicAsset';
import { getRaceDefinition } from '../races';
import { nip19 } from 'nostr-tools';

type CharacterTabProps = {
  questState: QuestState;
  userPubkey: string | undefined;
  onOpenChronicle: () => void;
};

const ALL_MODIFIER_BUCKETS: ModifierSheetBucket[] = ['stat', 'trait', 'skill', 'class', 'blessing', 'misc'];

const BUCKET_LABEL: Record<Exclude<ModifierSheetBucket, 'skill'>, string> = {
  stat: 'Stats (quests)',
  trait: 'Traits',
  class: 'Paths',
  blessing: 'Blessings',
  misc: 'Other modifiers',
};

function formatModifierLines(entries: [string, number][]): string {
  return entries.map(([k, v]) => `${formatModifierKeyForCharacterSheet(k)} ${v}`).join(', ');
}

function chunkPairs<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push(arr.slice(i, i + 2));
  }
  return out;
}

export function CharacterTab({ questState, userPubkey, onOpenChronicle }: CharacterTabProps) {
  const characterLevel = getCharacterLevel(questState);
  const characterClass = getCharacterClass(questState.modifiers);
  const race = getRaceDefinition(questState.assignedRaceSlug);
  const profileNpub = userPubkey ? nip19.npubEncode(userPubkey) : null;
  const copperTotal = getCopperFromModifiers(questState.modifiers);
  const coinLabel = formatCoinShort(splitCopperIntoCoins(copperTotal));

  const visibleSkillSheetParts: string[] = [];
  for (const key of SKILL_XP_KEYS) {
    const xp = questState.skills[key];
    if (xp < 1) continue;
    visibleSkillSheetParts.push(`${SKILL_SHEET_LABEL[key]} ${getLevelFromXp(xp)}`);
  }

  const visibleModifiers = Object.entries(questState.modifiers).filter(
    ([name, value]) =>
      value !== 0 &&
      getModifierMessageKind(name) !== 'hidden_class' &&
      !name.startsWith('currency:')
  );

  const byBucket = new Map<ModifierSheetBucket, [string, number][]>();
  for (const b of ALL_MODIFIER_BUCKETS) byBucket.set(b, []);
  for (const entry of visibleModifiers) {
    const bucket = getModifierSheetBucket(entry[0]);
    byBucket.get(bucket)!.push(entry);
  }

  const blessingLines = formatModifierLines(byBucket.get('blessing') ?? []);
  const skillGroups = groupSkillModifiersByCategory(byBucket.get('skill') ?? []);

  const statQuestRows = (byBucket.get('stat') ?? []).filter(([key]) => !isPrimaryStatCanonicalKey(key));
  const traitRows = byBucket.get('trait') ?? [];
  const pathRows = byBucket.get('class') ?? [];

  const detailTableCells: ReactNode[] = [];

  detailTableCells.push(
    <Fragment key="race">
      <span className="text-[var(--candle-ink)]">Race:</span>{' '}
      {questState.assignedRaceSlug ? (
        <span className="text-[var(--candle-ink-soft)]">{formatOrganicSlugForDisplay(questState.assignedRaceSlug)}</span>
      ) : (
        <span className="text-[var(--candle-ink-faint)]">—</span>
      )}
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="skills-xp">
      <span className="text-[var(--candle-ink)]">Skills:</span>{' '}
      {visibleSkillSheetParts.length > 0 ? visibleSkillSheetParts.join(', ') : '—'}
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="quest-items">
      <span className="text-[var(--candle-ink)]">Quest items:</span>{' '}
      {questState.questItems.length > 0 ? questState.questItems.join(', ') : '—'}
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="characteristics">
      <span className="text-[var(--candle-ink)]">Characteristics:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="relationships">
      <span className="text-[var(--candle-ink)]">Relationships:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="affinities">
      <span className="text-[var(--candle-ink)]">Affinities:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="afflictions">
      <span className="text-[var(--candle-ink)]">Afflictions:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="blessings">
      <span className="text-[var(--candle-ink)]">Blessings:</span>{' '}
      {blessingLines ? <span className="text-[var(--candle-ink-soft)]">{blessingLines}</span> : <span className="text-[var(--candle-ink-faint)]">—</span>}
    </Fragment>
  );

  detailTableCells.push(
    <Fragment key="curses">
      <span className="text-[var(--candle-ink)]">Curses:</span> <span className="text-[var(--candle-ink-faint)]">—</span>
    </Fragment>
  );

  if (statQuestRows.length > 0) {
    detailTableCells.push(
      <Fragment key="stats-quests">
        <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.stat}:</span> {formatModifierLines(statQuestRows)}
      </Fragment>
    );
  }

  if (traitRows.length > 0) {
    detailTableCells.push(
      <Fragment key="traits">
        <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.trait}:</span> {formatModifierLines(traitRows)}
      </Fragment>
    );
  }

  for (const { categoryKey, headingLabel, rows } of skillGroups) {
    detailTableCells.push(
      <Fragment key={`skill-cat-${categoryKey}`}>
        <span className="text-[var(--candle-ink)]">{headingLabel} skills:</span> {formatModifierLines(rows)}
      </Fragment>
    );
  }

  if (pathRows.length > 0) {
    detailTableCells.push(
      <Fragment key="paths">
        <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.class}:</span> {formatModifierLines(pathRows)}
      </Fragment>
    );
  }

  const miscRows = byBucket.get('misc') ?? [];
  const otherModifiersLine =
    miscRows.length > 0 ? (
      <p className="font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
        <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.misc}:</span> {formatModifierLines(miscRows)}
      </p>
    ) : null;

  return (
    <section className="space-y-2 pb-4">
      <div className="flex w-full justify-center py-0.5">
        <button
          type="button"
          onClick={onOpenChronicle}
          className="choice-line w-fit max-w-full text-center py-0.5 text-[var(--candle-wax)]"
        >
          Open full chronicle (dialogue and world events)
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:gap-8">
        <div className="flex justify-center">
          <img
            src={publicAsset('quest-images/sunset.jpg')}
            alt="Character portrait"
            className="h-[266px] w-[200px] rounded-md object-cover shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-[var(--candle-rule)]"
          />
        </div>
        <div className="flex flex-col justify-center gap-1">
          <p className="font-cormorant text-3xl font-semibold tracking-[0.04em] text-[var(--candle-ink)]">
            {questState.playerName || 'Stranger'}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--candle-ink-soft)]">
            Level {characterLevel} {characterClass}
          </p>
          <p className="font-serif text-sm text-[var(--candle-ink-soft)]">
            {race ? (
              <>
                <span aria-hidden="true">{race.symbolEmoji}</span> {race.displayName}
              </>
            ) : (
              <span className="text-[var(--candle-ink-faint)]">Race unknown</span>
            )}
          </p>
          <p className="font-serif text-sm">
            <span className="text-[var(--candle-ink-soft)]">Coin: </span>
            <span
              className={`font-mono ${
                copperTotal > 0 ? 'text-[var(--candle-ink)]' : 'text-[var(--candle-ink-faint)]'
              }`}
            >
              {coinLabel}
            </span>
          </p>
        </div>
      </div>
      <p className="text-center font-serif text-sm leading-snug text-[var(--candle-ink-soft)] py-0.5">
        Shareable profile link:{' '}
        <a
          href={profileNpub ? `https://ditto.pub/${profileNpub}` : '#'}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!profileNpub}
          className="text-[var(--candle-wax)] underline decoration-[var(--candle-rule)] underline-offset-4 transition-colors hover:decoration-[var(--candle-flame-soft)]"
        >
          your Ditto public profile
        </a>
      </p>
      <div className="grid grid-cols-3 gap-x-8 gap-y-0">
        {characterStats.map(([label]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 border-b border-[var(--candle-rule)] py-1.5 font-serif text-sm"
          >
            <p className="uppercase tracking-[0.12em] text-[var(--candle-ink-faint)]">{label}</p>
            <p className="font-mono text-[var(--candle-ink)]">
              {getPrimaryStatTotal(questState.modifiers, label)}
            </p>
          </div>
        ))}
      </div>
      {detailTableCells.length > 0 ? (
        <table className="w-full border-collapse font-serif text-sm leading-snug text-[var(--candle-ink-soft)]">
          <tbody>
            {chunkPairs(detailTableCells).map((pair, rowIdx) => (
              <tr key={rowIdx} className="align-top border-b border-[var(--candle-rule)]/40">
                <td className="w-1/2 py-0.5 pr-2 align-top">{pair[0]}</td>
                <td className="w-1/2 py-0.5 pl-2 align-top">{pair[1] ?? null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {otherModifiersLine}
    </section>
  );
}
