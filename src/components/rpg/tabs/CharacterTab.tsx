import { Fragment, type ReactNode } from 'react';
import { SKILL_SHEET_LABEL, SKILL_XP_KEYS } from '../quests/skills-config';
import {
  CHARACTER_SHEET_ORGANIC_SKILL_SPELL_MIN_MAGNITUDE,
  getCharacterLevel,
  getLevelFromXp,
} from '../quests/engine';
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
import { formatUnlockedTraitsLine } from '../traitSheet';
import { getRacePortraitSrc } from '../rpgArtAssignments';
import { getRaceDefinition } from '../races';
import { nip19 } from 'nostr-tools';
import { CharacterScreenCornerControls } from './CharacterScreenCornerControls';
import type { CharacterScreenCornerControlsProps } from './CharacterScreenCornerControls';

type CharacterTabProps = {
  questState: QuestState;
  userPubkey: string | undefined;
  /** Kindred count from social layer (logged-in only). */
  kindredSpirits?: number;
  onOpenChronicle: () => void;
} & CharacterScreenCornerControlsProps;

const ALL_MODIFIER_BUCKETS: ModifierSheetBucket[] = [
  'stat',
  'trait',
  'skill',
  'spell',
  'class',
  'blessing',
  'misc',
];

const BUCKET_LABEL: Record<Exclude<ModifierSheetBucket, 'skill'>, string> = {
  stat: 'Stats (quests)',
  trait: 'Traits',
  spell: 'Spells',
  class: 'Archetype tracks',
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

/** Primary stat grid: three columns; extra stats append new rows. */
const PRIMARY_STATS_COLUMNS = 3;

function chunkPrimaryStatRows(stats: ReadonlyArray<readonly string[]>): string[][][] {
  const rows: string[][][] = [];
  for (let i = 0; i < stats.length; i += PRIMARY_STATS_COLUMNS) {
    rows.push(stats.slice(i, i + PRIMARY_STATS_COLUMNS) as string[][]);
  }
  return rows;
}

const primaryStatTableRows = chunkPrimaryStatRows(characterStats);

/** Body copy (~50% of prior `text-sm` / 0.875rem). */
const bt = 'font-serif text-[0.4375rem] leading-snug';

export function CharacterTab({
  questState,
  userPubkey,
  kindredSpirits,
  onOpenChronicle,
  showModifierDetails,
  showDevTools,
  onAdvanceDay,
  devFiveMinuteDays,
  onDevFiveMinuteDaysChange,
  rapidDaySimulation,
  onRapidDaySimulationChange,
  onShowModifierDetailsChange,
  devUnlockAllQuests,
  onDevUnlockAllQuestsChange,
  onLogout,
  onResetStory,
}: CharacterTabProps) {
  const characterLevel = getCharacterLevel(questState);
  const characterClass = getCharacterClass(questState.modifiers);
  const race = getRaceDefinition(questState.assignedRaceSlug);
  const profileNpub = userPubkey ? nip19.npubEncode(userPubkey) : null;
  const copperTotal = getCopperFromModifiers(questState.modifiers);
  const coinLabel = formatCoinShort(splitCopperIntoCoins(copperTotal));

  const raceMiddle =
    race?.displayName ??
    (questState.assignedRaceSlug ? formatOrganicSlugForDisplay(questState.assignedRaceSlug) : 'Unknown');
  const raceEmoji = race?.symbolEmoji ?? '';

  const allSkillSheetParts: string[] = [];
  for (const key of SKILL_XP_KEYS) {
    const xp = questState.skills[key];
    const level = getLevelFromXp(xp);
    if (level < 1) continue;
    allSkillSheetParts.push(`${SKILL_SHEET_LABEL[key]} ${level}`);
  }

  const visibleModifiers = Object.entries(questState.modifiers).filter(([name, value]) => {
    if (getModifierMessageKind(name) === 'hidden_class' || name.startsWith('currency:')) return false;
    const mag = Math.abs(value);
    if (mag === 0) return false;
    const bucket = getModifierSheetBucket(name);
    if (bucket === 'skill' || bucket === 'spell') {
      return mag >= CHARACTER_SHEET_ORGANIC_SKILL_SPELL_MIN_MAGNITUDE;
    }
    return true;
  });

  const byBucket = new Map<ModifierSheetBucket, [string, number][]>();
  for (const b of ALL_MODIFIER_BUCKETS) byBucket.set(b, []);
  for (const entry of visibleModifiers) {
    const bucket = getModifierSheetBucket(entry[0]);
    byBucket.get(bucket)!.push(entry);
  }

  const blessingLines = formatModifierLines(byBucket.get('blessing') ?? []);
  const spellLines = formatModifierLines(byBucket.get('spell') ?? []);
  const skillBucketEntries = byBucket.get('skill') ?? [];
  const skillPrefixedForGroups = skillBucketEntries.filter(([k]) => k.startsWith('skill:'));
  const skillOrganicRows = skillBucketEntries.filter(([k]) => !k.startsWith('skill:'));
  const skillGroups = groupSkillModifiersByCategory(skillPrefixedForGroups);

  const statQuestRows = (byBucket.get('stat') ?? []).filter(([key]) => !isPrimaryStatCanonicalKey(key));
  const traitRows = byBucket.get('trait') ?? [];
  const traitTitlesLine = formatUnlockedTraitsLine(traitRows);
  const pathRows = byBucket.get('class') ?? [];

  const detailTableCells: ReactNode[] = [];

  if (allSkillSheetParts.length > 0) {
    detailTableCells.push(
      <Fragment key="skills-xp">
        <span className="text-[var(--candle-ink)]">Skills:</span>{' '}
        <span className="text-[var(--candle-ink-soft)]">{allSkillSheetParts.join(', ')}</span>
      </Fragment>
    );
  }
  if (questState.questItems.length > 0) {
    detailTableCells.push(
      <Fragment key="quest-items">
        <span className="text-[var(--candle-ink)]">Quest items:</span>{' '}
        <span className="text-[var(--candle-ink-soft)]">{questState.questItems.join(', ')}</span>
      </Fragment>
    );
  }

  if (showModifierDetails) {
    if (blessingLines) {
      detailTableCells.push(
        <Fragment key="blessings">
          <span className="text-[var(--candle-ink)]">Blessings:</span>{' '}
          <span className="text-[var(--candle-ink-soft)]">{blessingLines}</span>
        </Fragment>
      );
    }

    if (statQuestRows.length > 0) {
      detailTableCells.push(
        <Fragment key="stats-quests">
          <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.stat}:</span>{' '}
          <span className="text-[var(--candle-ink-soft)]">{formatModifierLines(statQuestRows)}</span>
        </Fragment>
      );
    }

    if (traitTitlesLine) {
      detailTableCells.push(
        <Fragment key="traits">
          <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.trait}:</span>{' '}
          <span className="text-[var(--candle-ink-soft)]">{traitTitlesLine}</span>
        </Fragment>
      );
    }

    for (const { categoryKey, headingLabel, rows } of skillGroups) {
      if (rows.length === 0) continue;
      detailTableCells.push(
        <Fragment key={`skill-cat-${categoryKey}`}>
          <span className="text-[var(--candle-ink)]">{headingLabel} skills:</span>{' '}
          <span className="text-[var(--candle-ink-soft)]">{formatModifierLines(rows)}</span>
        </Fragment>
      );
    }

    if (skillOrganicRows.length > 0) {
      detailTableCells.push(
        <Fragment key="skills-organic">
          <span className="text-[var(--candle-ink)]">Skills (ranks):</span>{' '}
          <span className="text-[var(--candle-ink-soft)]">{formatModifierLines(skillOrganicRows)}</span>
        </Fragment>
      );
    }

    if (spellLines) {
      detailTableCells.push(
        <Fragment key="spells">
          <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.spell}:</span>{' '}
          <span className="text-[var(--candle-ink-soft)]">{spellLines}</span>
        </Fragment>
      );
    }

    if (pathRows.length > 0) {
      detailTableCells.push(
        <Fragment key="paths">
          <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.class}:</span>{' '}
          <span className="text-[var(--candle-ink-soft)]">{formatModifierLines(pathRows)}</span>
        </Fragment>
      );
    }
  }

  const miscRows = byBucket.get('misc') ?? [];
  const otherModifiersLine =
    showModifierDetails && miscRows.length > 0 ? (
      <p className={`${bt} leading-relaxed text-[var(--candle-ink-soft)]`}>
        <span className="text-[var(--candle-ink)]">{BUCKET_LABEL.misc}:</span> {formatModifierLines(miscRows)}
      </p>
    ) : null;

  return (
    <section className="relative min-w-0 pb-14">
      <div className="facsimile-scroll-dialogue-inner min-w-0 space-y-2">
        <div className="flex min-w-0 flex-col items-center gap-3 py-0.5">
          <img
            src={getRacePortraitSrc(questState.assignedRaceSlug)}
            alt="Character portrait"
            className="aspect-[200/266] w-[min(100px,38vw)] shrink-0 rounded-md object-cover shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-[var(--candle-rule)]"
          />
          <div className="flex w-full min-w-0 max-w-md flex-col items-center gap-1.5 px-1 text-center">
            <p className="max-w-full break-words font-cormorant text-[0.9375rem] font-semibold tracking-[0.04em] text-[var(--candle-ink)]">
              {questState.playerName || 'Stranger'}
            </p>
            <p className="max-w-full break-words font-mono text-[0.34375rem] uppercase tracking-[0.18em] text-[var(--candle-ink-soft)] leading-snug">
              {raceEmoji ? (
                <span aria-hidden="true">
                  {raceEmoji}{' '}
                </span>
              ) : null}
              Level {characterLevel} {raceMiddle} {characterClass}
            </p>
            <p className={`${bt} text-[var(--candle-ink-soft)]`}>Coal Miner</p>
            <p className={bt}>
              <span className="text-[var(--candle-ink-soft)]">Coin: </span>
              <span
                className={`font-mono ${
                  copperTotal > 0 ? 'text-[var(--candle-ink)]' : 'text-[var(--candle-ink-faint)]'
                }`}
              >
                {coinLabel}
              </span>
            </p>
            {userPubkey != null && kindredSpirits !== undefined ? (
              <p className={bt}>
                <span className="text-[var(--candle-ink-soft)]">Kindred: </span>
                <span className="font-mono text-[var(--candle-ink)]">{kindredSpirits}</span>
              </p>
            ) : null}
          </div>
        </div>

      <table
        className="w-full min-w-0 table-fixed border-collapse font-serif text-[clamp(0.28rem,2.5vw,0.375rem)] leading-tight text-[var(--candle-ink-soft)]"
        aria-label="Primary attributes"
      >
        <tbody>
          {primaryStatTableRows.map((row, rowIdx) => {
            const padded: Array<string[] | null> = [...row];
            while (padded.length < PRIMARY_STATS_COLUMNS) padded.push(null);
            return (
              <tr key={rowIdx} className="border-b border-[var(--candle-rule)]">
                {padded.map((cell, colIdx) => (
                  <td
                    key={cell?.[0] ?? `pad-${rowIdx}-${colIdx}`}
                    className={`min-w-0 w-1/3 px-0.5 py-1 text-center align-top ${
                      colIdx < PRIMARY_STATS_COLUMNS - 1 ? 'border-r border-[var(--candle-rule)]/55' : ''
                    }`}
                  >
                    {cell ? (
                      <>
                        <div className="break-words uppercase tracking-[0.06em] text-[var(--candle-ink-faint)]">
                          {cell[0]}
                        </div>
                        <div className="mt-0.5 font-mono tabular-nums text-[var(--candle-ink)]">
                          {getPrimaryStatTotal(questState.modifiers, cell[0])}
                        </div>
                      </>
                    ) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {detailTableCells.length > 0 ? (
        <table className={`w-full min-w-0 border-collapse ${bt} text-[var(--candle-ink-soft)]`}>
          <tbody>
            {chunkPairs(detailTableCells).map((pair, rowIdx) => (
              <tr key={rowIdx} className="align-top">
                <td className="w-1/2 min-w-0 py-0.5 pr-2 align-top break-words">{pair[0]}</td>
                <td className="w-1/2 min-w-0 py-0.5 pl-2 align-top break-words">{pair[1] ?? null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {otherModifiersLine}

      <div className="flex w-full justify-center pt-2">
        <button
          type="button"
          onClick={onOpenChronicle}
          className="choice-line !w-fit !max-w-full !py-0.5 !text-[0.4375rem] text-center text-[var(--candle-wax)]"
        >
          Chronicle
        </button>
      </div>

      <p className={`${bt} mt-2 pt-2 pb-0 text-center leading-snug`}>
        {profileNpub ? (
          <a
            href={`https://ditto.pub/${profileNpub}`}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--candle-wax)] underline decoration-[var(--candle-rule)] underline-offset-4 transition-colors hover:decoration-[var(--candle-flame-soft)]"
          >
            Your Public Nostr Profile
          </a>
        ) : (
          <span className="text-[var(--candle-ink-faint)]">Your Public Nostr Profile</span>
        )}
      </p>
      </div>
      <CharacterScreenCornerControls
        showDevTools={showDevTools}
        onAdvanceDay={onAdvanceDay}
        devFiveMinuteDays={devFiveMinuteDays}
        onDevFiveMinuteDaysChange={onDevFiveMinuteDaysChange}
        rapidDaySimulation={rapidDaySimulation}
        onRapidDaySimulationChange={onRapidDaySimulationChange}
        showModifierDetails={showModifierDetails}
        onShowModifierDetailsChange={onShowModifierDetailsChange}
        devUnlockAllQuests={devUnlockAllQuests}
        onDevUnlockAllQuestsChange={onDevUnlockAllQuestsChange}
        onLogout={onLogout}
        onResetStory={onResetStory}
      />
    </section>
  );
}
