import { useMemo, useState } from 'react';
import type { CombatLoadout } from '../combat/combatTypes';
import {
  listActiveSkillOptions,
  listOwnedOtherEquipmentOptions,
  listOwnedWeaponOptions,
  type LoadoutOption,
} from '../combat/loadoutHelpers';
import { getSkillDisplayName, isSpellSkillId } from '../combat/skillRegistry';
import { formatModifierKeyForCharacterSheet } from '../helpers';
import { ItemName } from '../items/ItemName';
import type { QuestState } from '../quests/types';
import { HeaderFlyout } from '../HeaderFlyout';
import { CharacterAbilityTile } from './CharacterAbilityTile';
import type { CharacterAbilityTileData } from '../helpers';
import { CHAR_BODY } from './characterSheetTypography';

type SlotKind = 'weapon' | 'other' | 'skillA' | 'skillB';

const SLOT_LABEL: Record<SlotKind, string> = {
  weapon: 'Weapon',
  other: 'Equipment',
  skillA: 'Skill A',
  skillB: 'Skill B',
};

const SLOT_LABEL_CLASS: Record<SlotKind, string> = {
  weapon: 'text-[var(--loadout-slot-weapon)]',
  other: 'text-[var(--loadout-slot-equipment)]',
  skillA: 'text-[var(--loadout-slot-skill)]',
  skillB: 'text-[var(--loadout-slot-skill)]',
};

function loadoutTileAccentClass(
  kind: SlotKind,
  tile: CharacterAbilityTileData,
  selectedKey?: string
): string | undefined {
  if (tile.placeholder) {
    return 'text-[var(--candle-ink)]';
  }
  if (kind === 'weapon') return 'text-[var(--loadout-slot-weapon)]';
  if (kind === 'other') return 'text-[var(--loadout-slot-equipment)]';
  if ((kind === 'skillA' || kind === 'skillB') && selectedKey && isSpellSkillId(selectedKey)) {
    return 'text-[var(--loadout-slot-spell)]';
  }
  if (kind === 'skillA' || kind === 'skillB') return 'text-[var(--loadout-slot-skill)]';
  return undefined;
}

/** Match character sheet unlock threshold (see engine.ts). */
const LOADOUT_SKILL_MIN_MAGNITUDE = 1;

const menuItemClass =
  'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left font-serif text-sm text-[var(--candle-ink)] hover:bg-[var(--candle-flame)]/10 hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)] disabled:cursor-default disabled:opacity-60';

type CharacterLoadoutSlotsProps = {
  questState: QuestState;
  onLoadoutChange: (loadout: CombatLoadout) => void;
  /** Tighter 2×2 grid for narrow rails. */
  compact?: boolean;
  /** Evenly spaced single row (profile card footer). */
  spread?: boolean;
};

function slotTile(
  kind: SlotKind,
  key: string | undefined,
  label: string | undefined,
  level?: number
): CharacterAbilityTileData {
  if (!key) {
    return { id: `loadout-${kind}-empty`, name: '+', level: 0, placeholder: true };
  }
  return {
    id: `loadout-${kind}-${key}`,
    name: label ?? key,
    level: level ?? 1,
    showLevel: false,
  };
}

function LoadoutSlotPicker({
  kind,
  selectedKey,
  options,
  open,
  onOpenChange,
  onSelect,
  compactTile = false,
}: {
  kind: SlotKind;
  selectedKey?: string;
  options: LoadoutOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (key: string | undefined) => void;
  compactTile?: boolean;
}) {
  const tile = slotTile(
    kind,
    selectedKey,
    selectedKey
      ? options.find((o) => o.key === selectedKey)?.label ??
          (kind === 'weapon' || kind === 'other'
            ? formatModifierKeyForCharacterSheet(selectedKey)
            : getSkillDisplayName(selectedKey))
      : undefined,
    options.find((o) => o.key === selectedKey)?.level
  );

  const pick = (key: string | undefined) => {
    onSelect(key);
    onOpenChange(false);
  };

  return (
    <HeaderFlyout
      open={open}
      onOpenChange={onOpenChange}
      align="start"
      side="bottom"
      ariaLabel={`${SLOT_LABEL[kind]} loadout slot${selectedKey ? `: ${tile.name}` : ' (empty)'}`}
      panelClassName="max-h-48 w-48 overflow-y-auto border-[var(--candle-rule)] bg-[var(--candle-paper)] text-[var(--candle-ink)] shadow-md"
      trigger={
        <CharacterAbilityTile
          tile={tile}
          compact={compactTile}
          className={loadoutTileAccentClass(kind, tile, selectedKey)}
        />
      }
    >
      <button type="button" className={menuItemClass} onClick={() => pick(undefined)}>
        (empty)
      </button>
      {options.map((opt) => (
        <button key={opt.key} type="button" className={menuItemClass} onClick={() => pick(opt.key)}>
          {kind === 'weapon' ? (
            <span className="text-[var(--loadout-slot-weapon)]">{opt.label}</span>
          ) : kind === 'other' ? (
            <ItemName label={opt.label} itemKey={opt.key} category="equipment" />
          ) : isSpellSkillId(opt.key) ? (
            <span className="text-[var(--loadout-slot-spell)]">{opt.label}</span>
          ) : (
            <span className="text-[var(--loadout-slot-skill)]">{opt.label}</span>
          )}
        </button>
      ))}
      {options.length === 0 ? (
        <p className="px-2 py-1.5 font-serif text-sm text-[var(--candle-ink-faint)]">None owned</p>
      ) : null}
    </HeaderFlyout>
  );
}

export function CharacterLoadoutSlots({
  questState,
  onLoadoutChange,
  compact = false,
  spread = false,
}: CharacterLoadoutSlotsProps) {
  const [openSlot, setOpenSlot] = useState<SlotKind | null>(null);
  const loadout = questState.loadout ?? {};
  const weaponOptions = useMemo(() => listOwnedWeaponOptions(questState), [questState]);
  const otherOptions = useMemo(() => listOwnedOtherEquipmentOptions(questState), [questState]);
  const skillOptions = useMemo(() => listActiveSkillOptions(questState, LOADOUT_SKILL_MIN_MAGNITUDE), [questState]);

  const setSlot = (kind: SlotKind, value: string | undefined) => {
    const next: CombatLoadout = { ...loadout };
    if (kind === 'weapon') next.weapon = value;
    else if (kind === 'other') next.other = value;
    else if (kind === 'skillA') next.skillA = value;
    else next.skillB = value;
    onLoadoutChange(next);
  };

  const slotShellClass = spread
    ? 'grid w-full grid-cols-4 gap-0'
    : compact
      ? 'grid grid-cols-2 justify-items-center gap-x-1 gap-y-0'
      : `${CHAR_BODY} flex flex-wrap justify-center gap-2`;
  const slotColumnClass = spread ? 'flex flex-col items-center gap-0 leading-none' : 'flex flex-col items-center gap-0.5';
  const slotLabelClass = spread || compact ? 'text-[8px] leading-none' : 'text-[10px]';

  return (
    <section>
      <div className={slotShellClass}>
        <div className={slotColumnClass}>
          <LoadoutSlotPicker
            kind="weapon"
            compactTile={spread}
            selectedKey={loadout.weapon}
            options={weaponOptions}
            open={openSlot === 'weapon'}
            onOpenChange={(next) => setOpenSlot(next ? 'weapon' : null)}
            onSelect={(k) => setSlot('weapon', k)}
          />
          <span className={`${slotLabelClass} ${SLOT_LABEL_CLASS.weapon}`}>{SLOT_LABEL.weapon}</span>
        </div>
        <div className={slotColumnClass}>
          <LoadoutSlotPicker
            kind="other"
            compactTile={spread}
            selectedKey={loadout.other}
            options={otherOptions}
            open={openSlot === 'other'}
            onOpenChange={(next) => setOpenSlot(next ? 'other' : null)}
            onSelect={(k) => setSlot('other', k)}
          />
          <span className={`${slotLabelClass} ${SLOT_LABEL_CLASS.other}`}>{SLOT_LABEL.other}</span>
        </div>
        <div className={slotColumnClass}>
          <LoadoutSlotPicker
            kind="skillA"
            compactTile={spread}
            selectedKey={loadout.skillA}
            options={skillOptions}
            open={openSlot === 'skillA'}
            onOpenChange={(next) => setOpenSlot(next ? 'skillA' : null)}
            onSelect={(k) => setSlot('skillA', k)}
          />
          <span className={`${slotLabelClass} ${SLOT_LABEL_CLASS.skillA}`}>{SLOT_LABEL.skillA}</span>
        </div>
        <div className={slotColumnClass}>
          <LoadoutSlotPicker
            kind="skillB"
            compactTile={spread}
            selectedKey={loadout.skillB}
            options={skillOptions}
            open={openSlot === 'skillB'}
            onOpenChange={(next) => setOpenSlot(next ? 'skillB' : null)}
            onSelect={(k) => setSlot('skillB', k)}
          />
          <span className={`${slotLabelClass} ${SLOT_LABEL_CLASS.skillB}`}>{SLOT_LABEL.skillB}</span>
        </div>
      </div>
    </section>
  );
}
