import { useMemo, useState, type ReactNode } from 'react';
import { SKILL_SHEET_LABEL, type SkillXpKey } from '../quests/skills-config';
import {
  CHARACTER_SHEET_ORGANIC_SKILL_SPELL_MIN_MAGNITUDE,
  getCharacterLevel,
  getLevelFromXp,
} from '../quests/engine';
import {
  buildInventoryEntries,
  formatCoinShort,
  formatInjurySheetLines,
  formatModifierKeyForCharacterSheet,
  formatOrganicSlugForDisplay,
  getCharacterClass,
  getCopperFromModifiers,
  getModifierMessageKind,
  getModifierSheetBucket,
  getPrimaryStatTotal,
  groupSkillModifiersByCategory,
  isCombatSkillModifierKey,
  isItemModifierKey,
  isPrimaryStatCanonicalKey,
  partitionSkillGroups,
  splitCopperIntoCoins,
  type CharacterAbilityTileData,
} from '../helpers';
import { JOB_REGISTRY } from '../jobs/registry';
import { characterStats, CLASS_UNLOCK_POINTS, INJURY_SHEET_UNLOCK_POINTS } from '../constants';
import type { QuestState } from '../quests/types';
import type { ModifierSheetBucket } from '../helpers';
import { formatUnlockedTraitsLine } from '../traitSheet';
import { getRacePortraitSrc } from '../rpgArtAssignments';
import { getRaceDefinition } from '../races';
import { nip19 } from 'nostr-tools';
import { CharacterScreenCornerControls } from './CharacterScreenCornerControls';
import type { CharacterScreenCornerControlsProps } from './CharacterScreenCornerControls';
import { CharacterAbilityTileGrid } from './CharacterAbilityTileGrid';
import { CharacterInventoryDialog } from './CharacterInventoryDialog';
import {
  CHAR_SHEET_ACTION,
  CHAR_BODY,
  CHAR_FOOTER,
  CHAR_META_FAINT,
  CHAR_META_LABEL,
  CHAR_META_VALUE,
  CHAR_NAME,
  CHAR_STAT_LABEL,
  CHAR_STAT_TABLE,
  CHAR_STAT_VALUE,
  CHAR_SUBTITLE,
} from './characterSheetTypography';

type CharacterTabProps = {
  questState: QuestState;
  userPubkey: string | undefined;
  /** In-game day count (village pacing). */
  dayCounter: number;
  /** When false, days line shows a placeholder until village pacing begins. */
  dayPacingActive?: boolean;
  /** Active guild name (checkpoint or relay membership). */
  guildDisplayName?: string | null;
  /** Kindred count from social layer (logged-in only). */
  kindredSpirits?: number;
  onOpenChronicle: () => void;
} & CharacterScreenCornerControlsProps;

/** Profile placeholder until guild titles ship. */
const PROFILE_TITLE_PLACEHOLDER = 'Guild Leader';

function getActiveGuildName(questState: QuestState): string | null {
  const membership = questState.guildMembership;
  if (!membership || membership.leftAtMs !== undefined) return null;
  const name = membership.guildName.trim();
  return name.length > 0 ? name : null;
}

const ALL_MODIFIER_BUCKETS: ModifierSheetBucket[] = [
  'stat',
  'trait',
  'skill',
  'spell',
  'class',
  'blessing',
  'injury',
  'misc',
];

const BUCKET_LABEL: Record<Exclude<ModifierSheetBucket, 'skill'>, string> = {
  stat: 'Stats (quests)',
  trait: 'Traits',
  spell: 'Spells',
  class: 'Archetype tracks',
  blessing: 'Blessings',
  injury: 'Injuries',
  misc: 'Other modifiers',
};

const NON_COMBAT_XP_KEYS: SkillXpKey[] = ['explorationXp', 'foragingXp'];

function formatModifierLines(entries: [string, number][]): string {
  return entries.map(([k, v]) => `${formatModifierKeyForCharacterSheet(k)} ${v}`).join(', ');
}

/** Spells / `skill:*` / `injury:*` unlock at 1; other sheet buckets unlock at `CLASS_UNLOCK_POINTS`. */
function partitionSheetUnlock(
  bucket: ModifierSheetBucket,
  entries: [string, number][]
): { unlocked: [string, number][]; locked: [string, number][] } {
  const unlocked: [string, number][] = [];
  const locked: [string, number][] = [];
  const threshold =
    bucket === 'skill' || bucket === 'spell'
      ? CHARACTER_SHEET_ORGANIC_SKILL_SPELL_MIN_MAGNITUDE
      : bucket === 'injury'
        ? INJURY_SHEET_UNLOCK_POINTS
        : CLASS_UNLOCK_POINTS;
  for (const row of entries) {
    const mag = Math.abs(row[1]);
    if (mag >= threshold) unlocked.push(row);
    else if (mag > 0) locked.push(row);
  }
  return { unlocked, locked };
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

function modifierToAbilityTile(key: string, value: number): CharacterAbilityTileData {
  return {
    id: key,
    name: formatModifierKeyForCharacterSheet(key),
    level: Math.abs(value),
  };
}

function ColumnBlock({
  label,
  children,
  faint,
}: {
  label: string;
  children: ReactNode;
  faint?: boolean;
}) {
  return (
    <p className={`${CHAR_BODY} text-left leading-relaxed text-[var(--candle-ink-soft)]`}>
      <span className={faint ? CHAR_META_FAINT : CHAR_META_VALUE}>{label}</span>{' '}
      <span className="break-words">{children}</span>
    </p>
  );
}

function buildUnifiedSkillsText(
  xpParts: string[],
  generalRows: [string, number][],
  organicNonCombat: [string, number][]
): string | null {
  const segments: string[] = [...xpParts];
  if (generalRows.length > 0) segments.push(formatModifierLines(generalRows));
  if (organicNonCombat.length > 0) segments.push(formatModifierLines(organicNonCombat));
  return segments.length > 0 ? segments.join(', ') : null;
}

function formatProfileDaysLabel(dayCounter: number, dayPacingActive: boolean): string {
  if (!dayPacingActive) return '— Days';
  return dayCounter === 1 ? '1 Day' : `${dayCounter} Days`;
}

export function CharacterTab({
  questState,
  userPubkey,
  dayCounter,
  dayPacingActive = true,
  guildDisplayName,
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
  showQuestChoiceEffects,
  onShowQuestChoiceEffectsChange,
  devUnlockAllQuests,
  onDevUnlockAllQuestsChange,
  onLogout,
  onResetStory,
}: CharacterTabProps) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const inventoryEntries = useMemo(() => buildInventoryEntries(questState), [questState]);

  const characterLevel = getCharacterLevel(questState);
  const characterClass = getCharacterClass(questState.modifiers);
  const race = getRaceDefinition(questState.assignedRaceSlug);
  const profileNpub = userPubkey ? nip19.npubEncode(userPubkey) : null;
  const copperTotal = getCopperFromModifiers(questState.modifiers);
  const coinLabel = formatCoinShort(splitCopperIntoCoins(copperTotal));

  const activeJob = questState.activeJobSlug
    ? JOB_REGISTRY[questState.activeJobSlug]
    : undefined;
  const activeGuildName = guildDisplayName ?? getActiveGuildName(questState);

  const raceMiddle =
    race?.displayName ??
    (questState.assignedRaceSlug ? formatOrganicSlugForDisplay(questState.assignedRaceSlug) : 'Unknown');
  const raceEmoji = race?.symbolEmoji ?? '';

  const nonCombatXpParts: string[] = [];
  for (const key of NON_COMBAT_XP_KEYS) {
    const xp = questState.skills[key];
    const level = getLevelFromXp(xp);
    if (level < 1) continue;
    nonCombatXpParts.push(`${SKILL_SHEET_LABEL[key]} ${level}`);
  }

  const meleeXpLevel = getLevelFromXp(questState.skills.meleeAttackXp);

  /** All non-zero modifiers for bucketing; per-bucket unlock thresholds decide default vs dev-only rows. */
  const visibleModifiers = Object.entries(questState.modifiers).filter(
    ([name, value]) =>
      getModifierMessageKind(name) !== 'hidden_class' &&
      !name.startsWith('currency:') &&
      !isItemModifierKey(name) &&
      Math.abs(value) !== 0
  );

  const byBucket = new Map<ModifierSheetBucket, [string, number][]>();
  for (const b of ALL_MODIFIER_BUCKETS) byBucket.set(b, []);
  for (const entry of visibleModifiers) {
    const bucket = getModifierSheetBucket(entry[0]);
    byBucket.get(bucket)!.push(entry);
  }

  const blessingEntries = byBucket.get('blessing') ?? [];
  const blessingPart = partitionSheetUnlock('blessing', blessingEntries);
  const blessingLinesUnlocked = formatModifierLines(blessingPart.unlocked);
  const blessingLinesLocked = formatModifierLines(blessingPart.locked);

  const injuryEntries = byBucket.get('injury') ?? [];
  const injuryPart = partitionSheetUnlock('injury', injuryEntries);
  const injuryLinesUnlocked = formatInjurySheetLines(injuryPart.unlocked);
  const injuryLinesLocked = formatInjurySheetLines(injuryPart.locked);

  const spellEntries = byBucket.get('spell') ?? [];
  const spellPart = partitionSheetUnlock('spell', spellEntries);

  const skillBucketEntries = byBucket.get('skill') ?? [];
  const skillPart = partitionSheetUnlock('skill', skillBucketEntries);
  const skillPrefixedUnlocked = skillPart.unlocked.filter(([k]) => k.startsWith('skill:'));
  const skillOrganicUnlocked = skillPart.unlocked.filter(([k]) => !k.startsWith('skill:'));
  const skillPrefixedLocked = skillPart.locked.filter(([k]) => k.startsWith('skill:'));
  const skillOrganicLocked = skillPart.locked.filter(([k]) => !k.startsWith('skill:'));
  const skillGroups = groupSkillModifiersByCategory(skillPrefixedUnlocked);
  const skillGroupsLocked = groupSkillModifiersByCategory(skillPrefixedLocked);
  const { combat: combatSkillGroups, nonCombat: nonCombatSkillGroups } = partitionSkillGroups(skillGroups);
  const { combat: combatSkillGroupsLocked, nonCombat: nonCombatSkillGroupsLocked } =
    partitionSkillGroups(skillGroupsLocked);

  const organicCombatUnlocked = skillOrganicUnlocked.filter(([k]) => isCombatSkillModifierKey(k));
  const organicNonCombatUnlocked = skillOrganicUnlocked.filter(([k]) => !isCombatSkillModifierKey(k));
  const organicCombatLocked = skillOrganicLocked.filter(([k]) => isCombatSkillModifierKey(k));
  const organicNonCombatLocked = skillOrganicLocked.filter(([k]) => !isCombatSkillModifierKey(k));

  const statQuestRowsAll = (byBucket.get('stat') ?? []).filter(([key]) => !isPrimaryStatCanonicalKey(key));
  const statQuestPart = partitionSheetUnlock('stat', statQuestRowsAll);
  const statQuestLinesUnlocked = formatModifierLines(statQuestPart.unlocked);
  const statQuestLinesLocked = formatModifierLines(statQuestPart.locked);

  const traitRows = byBucket.get('trait') ?? [];
  const traitPart = partitionSheetUnlock('trait', traitRows);
  const traitTitlesLine = formatUnlockedTraitsLine(traitPart.unlocked);
  const traitLinesLocked = formatModifierLines(traitPart.locked);

  const pathRowsAll = byBucket.get('class') ?? [];
  const pathPart = partitionSheetUnlock('class', pathRowsAll);
  const pathLinesUnlocked = formatModifierLines(pathPart.unlocked);
  const pathLinesLocked = formatModifierLines(pathPart.locked);

  const miscRowsAll = (byBucket.get('misc') ?? []).filter(([k]) => !isItemModifierKey(k));
  const miscPart = partitionSheetUnlock('misc', miscRowsAll);
  const miscLinesUnlocked = formatModifierLines(miscPart.unlocked);
  const miscLinesLocked = formatModifierLines(miscPart.locked);

  const combatTilesRaw: CharacterAbilityTileData[] = [];
  if (meleeXpLevel >= 1) {
    combatTilesRaw.push({
      id: 'meleeAttackXp',
      name: SKILL_SHEET_LABEL.meleeAttackXp,
      level: meleeXpLevel,
    });
  }
  for (const group of combatSkillGroups) {
    for (const [key, value] of group.rows) {
      combatTilesRaw.push(modifierToAbilityTile(key, value));
    }
  }
  for (const [key, value] of organicCombatUnlocked) {
    combatTilesRaw.push(modifierToAbilityTile(key, value));
  }
  const combatTiles = combatTilesRaw;

  const spellTiles: CharacterAbilityTileData[] = spellPart.unlocked.map(([key, value]) =>
    modifierToAbilityTile(key, value)
  );

  const generalSkillGroup = nonCombatSkillGroups.find((g) => g.categoryKey === 'general');
  const generalSkillGroupLocked = nonCombatSkillGroupsLocked.find((g) => g.categoryKey === 'general');
  const categorizedNonCombatGroups = nonCombatSkillGroups.filter((g) => g.categoryKey !== 'general');
  const categorizedNonCombatGroupsLocked = nonCombatSkillGroupsLocked.filter(
    (g) => g.categoryKey !== 'general'
  );

  const unifiedSkillsLine = buildUnifiedSkillsText(
    nonCombatXpParts,
    generalSkillGroup?.rows ?? [],
    organicNonCombatUnlocked
  );
  const unifiedSkillsLockedLine = buildUnifiedSkillsText(
    [],
    generalSkillGroupLocked?.rows ?? [],
    organicNonCombatLocked
  );

  const columnACells: ReactNode[] = [];

  if (unifiedSkillsLine) {
    columnACells.push(
      <ColumnBlock key="skills-unified" label="Skills:">
        {unifiedSkillsLine}
      </ColumnBlock>
    );
  }
  if (questState.questItems.length > 0) {
    columnACells.push(
      <ColumnBlock key="quest-items" label="Quest items:">
        <span>{questState.questItems.join(', ')}</span>
      </ColumnBlock>
    );
  }
  if (traitTitlesLine) {
    columnACells.push(
      <ColumnBlock key="traits" label={`${BUCKET_LABEL.trait}:`}>
        <span>{traitTitlesLine}</span>
      </ColumnBlock>
    );
  }
  if (blessingLinesUnlocked) {
    columnACells.push(
      <ColumnBlock key="blessings" label="Blessings:">
        <span>{blessingLinesUnlocked}</span>
      </ColumnBlock>
    );
  }
  if (injuryLinesUnlocked) {
    columnACells.push(
      <ColumnBlock key="injuries" label={`${BUCKET_LABEL.injury}:`}>
        <span>{injuryLinesUnlocked}</span>
      </ColumnBlock>
    );
  }
  if (statQuestLinesUnlocked) {
    columnACells.push(
      <ColumnBlock key="stats-quests" label={`${BUCKET_LABEL.stat}:`}>
        <span>{statQuestLinesUnlocked}</span>
      </ColumnBlock>
    );
  }
  if (pathLinesUnlocked) {
    columnACells.push(
      <ColumnBlock key="paths" label={`${BUCKET_LABEL.class}:`}>
        <span>{pathLinesUnlocked}</span>
      </ColumnBlock>
    );
  }

  for (const { categoryKey, headingLabel, rows } of categorizedNonCombatGroups) {
    if (rows.length === 0) continue;
    columnACells.push(
      <ColumnBlock key={`skill-cat-${categoryKey}`} label={`${headingLabel} skills:`}>
        {formatModifierLines(rows)}
      </ColumnBlock>
    );
  }

  if (showModifierDetails) {
    if (blessingLinesLocked) {
      columnACells.push(
        <ColumnBlock key="blessings-locked" label="Blessings (in progress):" faint>
          <span>{blessingLinesLocked}</span>
        </ColumnBlock>
      );
    }
    if (injuryLinesLocked) {
      columnACells.push(
        <ColumnBlock key="injuries-locked" label={`${BUCKET_LABEL.injury} (in progress):`} faint>
          <span>{injuryLinesLocked}</span>
        </ColumnBlock>
      );
    }
    if (statQuestLinesLocked) {
      columnACells.push(
        <ColumnBlock key="stats-quests-locked" label={`${BUCKET_LABEL.stat} (in progress):`} faint>
          <span>{statQuestLinesLocked}</span>
        </ColumnBlock>
      );
    }
    if (traitLinesLocked) {
      columnACells.push(
        <ColumnBlock key="traits-locked" label={`${BUCKET_LABEL.trait} (in progress):`} faint>
          <span>{traitLinesLocked}</span>
        </ColumnBlock>
      );
    }
    if (unifiedSkillsLockedLine) {
      columnACells.push(
        <ColumnBlock key="skills-unified-locked" label="Skills (in progress):" faint>
          {unifiedSkillsLockedLine}
        </ColumnBlock>
      );
    }
    for (const { categoryKey, headingLabel, rows } of categorizedNonCombatGroupsLocked) {
      if (rows.length === 0) continue;
      columnACells.push(
        <ColumnBlock key={`skill-cat-locked-${categoryKey}`} label={`${headingLabel} skills (in progress):`} faint>
          {formatModifierLines(rows)}
        </ColumnBlock>
      );
    }
    if (spellPart.locked.length > 0) {
      columnACells.push(
        <ColumnBlock key="spells-locked" label={`${BUCKET_LABEL.spell} (in progress):`} faint>
          <span>{formatModifierLines(spellPart.locked)}</span>
        </ColumnBlock>
      );
    }
    for (const group of combatSkillGroupsLocked) {
      if (group.rows.length === 0) continue;
      columnACells.push(
        <ColumnBlock
          key={`combat-locked-${group.categoryKey}`}
          label={`${group.headingLabel} skills (in progress):`}
          faint
        >
          <span>{formatModifierLines(group.rows)}</span>
        </ColumnBlock>
      );
    }
    if (organicCombatLocked.length > 0) {
      columnACells.push(
        <ColumnBlock key="combat-organic-locked" label="Combat skills (in progress):" faint>
          <span>{formatModifierLines(organicCombatLocked)}</span>
        </ColumnBlock>
      );
    }
    if (pathLinesLocked) {
      columnACells.push(
        <ColumnBlock key="paths-locked" label={`${BUCKET_LABEL.class} (in progress):`} faint>
          <span>{pathLinesLocked}</span>
        </ColumnBlock>
      );
    }
  }

  return (
    <section className="relative min-w-0 pb-14">
      <div className="facsimile-scroll-dialogue-inner facsimile-scroll-dialogue-inner--character min-w-0">
        <div className="mx-auto w-full min-w-0 max-w-md space-y-2.5">
        <div className="py-0.5">
          <div className="mx-auto flex w-fit items-center gap-3">
            <img
                src={getRacePortraitSrc(questState.assignedRaceSlug)}
                alt="Character portrait"
                className="aspect-[200/266] w-[min(100px,32vw)] shrink-0 rounded-md object-cover shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-[var(--candle-rule)]"
              />
              <div className="flex w-44 shrink-0 flex-col gap-1.5 text-left">
                <div className="flex flex-col gap-0.5">
                  <p className={`block break-words text-center ${CHAR_NAME}`}>
                    {questState.playerName || 'Stranger'}
                  </p>
                  <p className={`block break-words text-center ${CHAR_SUBTITLE}`}>
                    {raceEmoji ? (
                      <span aria-hidden="true">
                        {raceEmoji}{' '}
                      </span>
                    ) : null}
                    Level {characterLevel} {raceMiddle} {characterClass}
                  </p>
                </div>
                <div className={`mt-0.5 grid grid-cols-2 gap-x-3 gap-y-1 ${CHAR_BODY}`}>
                  <div className="flex min-w-0 flex-col gap-1 text-left">
                    <p className={`block ${CHAR_META_VALUE}`}>
                      {formatProfileDaysLabel(dayCounter, dayPacingActive)}
                    </p>
                    <p className={`block ${CHAR_META_VALUE}`}>
                      {activeJob ? `${activeJob.displayName} Lv 1` : 'Unemployed'}
                    </p>
                    <p className="block">
                      <span className={CHAR_META_LABEL}>Coin: </span>
                      <span
                        className={`font-mono ${copperTotal > 0 ? CHAR_META_VALUE : CHAR_META_FAINT}`}
                      >
                        {coinLabel}
                      </span>
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 text-left">
                    <p className="block">
                      <span className={CHAR_META_LABEL}>Guild: </span>
                      {activeGuildName ? (
                        <span className={CHAR_META_VALUE}>{activeGuildName}</span>
                      ) : (
                        <span className={CHAR_META_FAINT}>—</span>
                      )}
                    </p>
                    <p className="block">
                      <span className={CHAR_META_LABEL}>Title: </span>
                      <span className={CHAR_META_VALUE}>{PROFILE_TITLE_PLACEHOLDER}</span>
                    </p>
                    <p className="block">
                      <span className={CHAR_META_LABEL}>Kindred: </span>
                      {userPubkey != null && kindredSpirits !== undefined ? (
                        <span className={`font-mono ${CHAR_META_VALUE}`}>{kindredSpirits}</span>
                      ) : (
                        <span className={CHAR_META_FAINT}>—</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
          </div>
        </div>

        <table
          className={`w-full min-w-0 table-fixed border-collapse ${CHAR_STAT_TABLE}`}
          aria-label="Primary attributes"
        >
          <tbody>
            {primaryStatTableRows.map((row, rowIdx) => {
              const padded: Array<string[] | null> = [...row];
              while (padded.length < PRIMARY_STATS_COLUMNS) padded.push(null);
              return (
                <tr key={rowIdx}>
                  {padded.map((cell, colIdx) => (
                    <td
                      key={cell?.[0] ?? `pad-${rowIdx}-${colIdx}`}
                      className="min-w-0 w-1/3 px-1 py-1.5 text-center align-top"
                    >
                      {cell ? (
                        <>
                          <div className={CHAR_STAT_LABEL}>{cell[0]}</div>
                          <div className={CHAR_STAT_VALUE}>
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

        <section className="space-y-2.5 pt-1.5" aria-label="Skills and traits">
          <CharacterAbilityTileGrid tiles={combatTiles} label="Combat skills" />

          <div className={`min-w-0 space-y-1.5 text-left ${CHAR_BODY}`}>{columnACells}</div>

          <CharacterAbilityTileGrid tiles={spellTiles} label="Spells" />

          {showModifierDetails && miscLinesUnlocked ? (
            <p className={`${CHAR_BODY} text-left leading-relaxed text-[var(--candle-ink-soft)]`}>
              <span className={CHAR_META_LABEL}>{BUCKET_LABEL.misc}:</span> {miscLinesUnlocked}
            </p>
          ) : null}
          {showModifierDetails && miscLinesLocked ? (
            <p className={`${CHAR_BODY} text-left leading-relaxed text-[var(--candle-ink-soft)]`}>
              <span className={CHAR_META_FAINT}>Other modifiers (in progress):</span> {miscLinesLocked}
            </p>
          ) : null}

          <div className="flex w-full justify-center px-1 pt-2 pb-0.5">
            <button
              type="button"
              onClick={() => setInventoryOpen(true)}
              className="character-inventory-btn"
              aria-haspopup="dialog"
            >
              Inventory
            </button>
          </div>
        </section>

        <div className="flex w-full justify-center pt-2">
          <button
            type="button"
            onClick={onOpenChronicle}
            className={`${CHAR_SHEET_ACTION} !w-fit !max-w-full`}
          >
            Chronicle
          </button>
        </div>

        <p className={`${CHAR_FOOTER} mt-2 pt-2 pb-0 text-center`}>
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
      </div>

      <CharacterInventoryDialog
        open={inventoryOpen}
        onOpenChange={setInventoryOpen}
        entries={inventoryEntries}
      />

      <CharacterScreenCornerControls
        showDevTools={showDevTools}
        onAdvanceDay={onAdvanceDay}
        devFiveMinuteDays={devFiveMinuteDays}
        onDevFiveMinuteDaysChange={onDevFiveMinuteDaysChange}
        rapidDaySimulation={rapidDaySimulation}
        onRapidDaySimulationChange={onRapidDaySimulationChange}
        showModifierDetails={showModifierDetails}
        onShowModifierDetailsChange={onShowModifierDetailsChange}
        showQuestChoiceEffects={showQuestChoiceEffects}
        onShowQuestChoiceEffectsChange={onShowQuestChoiceEffectsChange}
        devUnlockAllQuests={devUnlockAllQuests}
        onDevUnlockAllQuestsChange={onDevUnlockAllQuestsChange}
        onLogout={onLogout}
        onResetStory={onResetStory}
      />
    </section>
  );
}
