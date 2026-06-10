import { useMemo, useState, type ReactNode } from 'react';
import { SKILL_SHEET_LABEL, type SkillXpKey } from '../quests/skills-config';
import {
  CHARACTER_SHEET_ORGANIC_SKILL_SPELL_MIN_MAGNITUDE,
  getCharacterLevel,
  getLevelFromXp,
  resolveDisplayDay,
} from '../quests/engine';
import {
  buildInventoryEntries,
  formatInjurySheetLines,
  formatModifierKeyForCharacterSheet,
  formatOrganicSlugForDisplay,
  getCharacterClass,
  getCopperFromModifiers,
  getModifierMessageKind,
  getModifierSheetBucket,
  groupSkillModifiersByCategory,
  isCombatSkillModifierKey,
  isItemModifierKey,
  isPrimaryStatCanonicalKey,
  partitionSkillGroups,
  splitCopperIntoCoins,
} from '../helpers';
import { JOB_REGISTRY } from '../jobs/registry';
import {
  CLASS_UNLOCK_POINTS,
  INJURY_SHEET_UNLOCK_POINTS,
  JOB_SLUG_EXPLORER,
} from '../constants';
import type { QuestState } from '../quests/types';
import type { ModifierSheetBucket } from '../helpers';
import { formatUnlockedTraitsLine } from '../traitSheet';
import { getRaceDefinition } from '../races';
import { nip19 } from 'nostr-tools';
import { CharacterScreenCornerControls } from './CharacterScreenCornerControls';
import type { CharacterScreenCornerControlsProps } from './CharacterScreenCornerControls';
import { ItemNameList } from '../items/ItemName';
import { CharacterInventoryDialog } from './CharacterInventoryDialog';
import { CHARACTER_PROFILE_CARD_SHELL, CharacterProfileCard } from './CharacterProfileCard';
import type { CombatLoadout } from '../combat/combatTypes';
import { CharacterSheetSkillColumn } from './CharacterSheetSkillColumn';
import {
  SHEET_COMBAT_SKILL_PLACEHOLDERS,
  SHEET_PASSIVE_SKILL_PLACEHOLDERS,
  SHEET_SPELL_PLACEHOLDERS,
} from './characterSheetPlaceholders';
import {
  CHAR_BODY,
  CHAR_META_FAINT,
  CHAR_META_LABEL,
  CHAR_META_VALUE,
  CHAR_MINOR,
  CHAR_PROFILE_LINK,
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
  onLoadoutChange: (loadout: CombatLoadout) => void;
} & CharacterScreenCornerControlsProps;

/** Profile placeholder until guild membership ships. */
const PROFILE_GUILD_PLACEHOLDER = 'House Dyer';

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

/** Skill column headers beside the compact stat row. */
const SHEET_SKILL_COLUMN_LABELS = {
  combat: 'Combat',
  passive: 'Passive',
  spells: 'Spells',
} as const;

function ColumnBlock({
  label,
  children,
  faint,
  compact,
}: {
  label: string;
  children: ReactNode;
  faint?: boolean;
  compact?: boolean;
}) {
  return (
    <p
      className={
        compact
          ? `${CHAR_MINOR} text-left`
          : `${CHAR_BODY} text-left leading-relaxed text-[var(--candle-ink-soft)]`
      }
    >
      <span className={faint || compact ? CHAR_META_FAINT : CHAR_META_VALUE}>{label}</span>{' '}
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

function formatProfileAgeLabel(questState: QuestState, calendarDay: number): string {
  const days = resolveDisplayDay(questState, calendarDay);
  return `Age: ${days} ${days === 1 ? 'Day' : 'Days'}`;
}

export function CharacterTab({
  questState,
  userPubkey,
  dayCounter,
  dayPacingActive: _dayPacingActive = true,
  guildDisplayName,
  kindredSpirits,
  onLoadoutChange,
  showModifierDetails,
  showDevTools,
  onShowModifierDetailsChange,
  showQuestChoiceModifiers,
  onShowQuestChoiceModifiersChange,
  showQuestChoiceEffects,
  onShowQuestChoiceEffectsChange,
  devUnlockAllQuests,
  onDevUnlockAllQuestsChange,
  onDevGrantCoins,
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
  const coinSplit = splitCopperIntoCoins(copperTotal);

  const profileJobSlug =
    questState.activeJobSlug && questState.activeJobSlug !== JOB_SLUG_EXPLORER
      ? questState.activeJobSlug
      : null;
  const activeJob = profileJobSlug ? JOB_REGISTRY[profileJobSlug] : undefined;
  const activeGuildName =
    guildDisplayName ?? getActiveGuildName(questState) ?? PROFILE_GUILD_PLACEHOLDER;

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
  const { nonCombat: nonCombatSkillGroups } = partitionSkillGroups(skillGroups);
  const { combat: combatSkillGroupsLocked, nonCombat: nonCombatSkillGroupsLocked } =
    partitionSkillGroups(skillGroupsLocked);

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
      <ColumnBlock key="quest-items" label="Quest items:" compact>
        <ItemNameList
          items={questState.questItems.map((label) => ({ label, category: 'quest' as const }))}
        />
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
        <div className={`py-0.5 space-y-2 ${CHARACTER_PROFILE_CARD_SHELL}`}>
          <CharacterProfileCard
            questState={questState}
            ageLabel={formatProfileAgeLabel(questState, dayCounter)}
            guildDisplayName={activeGuildName}
            characterLevel={characterLevel}
            raceMiddle={raceMiddle}
            characterClass={characterClass}
            raceEmoji={raceEmoji}
            jobLine={activeJob ? `${activeJob.displayName} Lv 1` : 'Unemployed'}
            coinSplit={coinSplit}
            kindredSpirits={kindredSpirits}
            userPubkey={userPubkey}
            onLoadoutChange={onLoadoutChange}
          />

          <div className="grid grid-cols-3 gap-1" aria-label="Skills and spells">
            <CharacterSheetSkillColumn
              label={SHEET_SKILL_COLUMN_LABELS.combat}
              placeholders={SHEET_COMBAT_SKILL_PLACEHOLDERS}
              accentClassName="text-[var(--loadout-slot-skill)]"
            />
            <CharacterSheetSkillColumn
              label={SHEET_SKILL_COLUMN_LABELS.passive}
              placeholders={SHEET_PASSIVE_SKILL_PLACEHOLDERS}
            />
            <CharacterSheetSkillColumn
              label={SHEET_SKILL_COLUMN_LABELS.spells}
              placeholders={SHEET_SPELL_PLACEHOLDERS}
              accentClassName="text-[var(--loadout-slot-spell)]"
            />
          </div>
        </div>

        <section className="space-y-2.5 pt-1.5" aria-label="Skills and traits">
          <div className={`min-w-0 space-y-1.5 text-left ${CHAR_BODY}`}>{columnACells}</div>

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

        </div>
      </div>

      <div
        className="pointer-events-auto fixed z-30 max-w-[min(42vw,11rem)] pr-[var(--facsimile-scrollbar-width)] text-right"
        style={{
          right: 'max(0.5rem, env(safe-area-inset-right, 0px))',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 3.35rem)',
        }}
      >
        {profileNpub ? (
          <a
            href={`https://ditto.pub/${profileNpub}`}
            target="_blank"
            rel="noreferrer"
            className={`${CHAR_PROFILE_LINK} underline decoration-[var(--candle-rule)] underline-offset-2 transition-colors hover:decoration-[var(--candle-flame-soft)]`}
          >
            Your Public Nostr Profile
          </a>
        ) : (
          <span className={`${CHAR_PROFILE_LINK} text-[var(--candle-ink-faint)]`}>
            Your Public Nostr Profile
          </span>
        )}
      </div>

      <CharacterInventoryDialog
        open={inventoryOpen}
        onOpenChange={setInventoryOpen}
        entries={inventoryEntries}
      />

      <CharacterScreenCornerControls
        showDevTools={showDevTools}
        showModifierDetails={showModifierDetails}
        onShowModifierDetailsChange={onShowModifierDetailsChange}
        showQuestChoiceModifiers={showQuestChoiceModifiers}
        onShowQuestChoiceModifiersChange={onShowQuestChoiceModifiersChange}
        showQuestChoiceEffects={showQuestChoiceEffects}
        onShowQuestChoiceEffectsChange={onShowQuestChoiceEffectsChange}
        devUnlockAllQuests={devUnlockAllQuests}
        onDevUnlockAllQuestsChange={onDevUnlockAllQuestsChange}
        onDevGrantCoins={onDevGrantCoins}
        onLogout={onLogout}
        onResetStory={onResetStory}
      />
    </section>
  );
}
