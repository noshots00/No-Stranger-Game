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
  if ((kind === 'skillA' || kind === 'skillB') && selectedKey && isSpellSkillId(selectedKey)) {
    return 'text-[var(--loadout-slot-spell)]';
  }
  return undefined;
}

/** Match character sheet unlock threshold (see engine.ts). */
const LOADOUT_SKILL_MIN_MAGNITUDE = 1;

const menuItemClass =
  'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left font-serif text-sm text-[var(--candle-ink)] hover:bg-[var(--candle-flame)]/10 hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)] disabled:cursor-default disabled:opacity-60';

type CharacterLoadoutSlotsProps = {
  questState: QuestState;
  onLoadoutChange: (loadout: CombatLoadout) => void;
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
    itemCategory: kind === 'weapon' || kind === 'other' ? 'equipment' : undefined,
  };
}

function LoadoutSlotPicker({
  kind,
  selectedKey,
  options,
  open,
  onOpenChange,
  onSelect,
}: {
  kind: SlotKind;
  selectedKey?: string;
  options: LoadoutOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (key: string | undefined) => void;
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
      trigger={<CharacterAbilityTile tile={tile} className={loadoutTileAccentClass(kind, tile, selectedKey)} />}
    >
      <button type="button" className={menuItemClass} onClick={() => pick(undefined)}>
        (empty)
      </button>
      {options.map((opt) => (
        <button key={opt.key} type="button" className={menuItemClass} onClick={() => pick(opt.key)}>
          <ItemName
            label={opt.label}
            itemKey={kind === 'weapon' || kind === 'other' ? opt.key : undefined}
            category={kind === 'weapon' || kind === 'other' ? 'equipment' : undefined}
          />
          {opt.level !== undefined ? ` (Lv ${opt.level})` : ''}
        </button>
      ))}
      {options.length === 0 ? (
        <p className="px-2 py-1.5 font-serif text-sm text-[var(--candle-ink-faint)]">None owned</p>
      ) : null}
    </HeaderFlyout>
  );
}

export function CharacterLoadoutSlots({ questState, onLoadoutChange }: CharacterLoadoutSlotsProps) {
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

  return (
    <section>
      <div className={`${CHAR_BODY} flex flex-wrap justify-center gap-2`}>
        <div className="flex flex-col items-center gap-0.5">
          <LoadoutSlotPicker
            kind="weapon"
            selectedKey={loadout.weapon}
            options={weaponOptions}
            open={openSlot === 'weapon'}
            onOpenChange={(next) => setOpenSlot(next ? 'weapon' : null)}
            onSelect={(k) => setSlot('weapon', k)}
          />
          <span className={`text-[10px] ${SLOT_LABEL_CLASS.weapon}`}>{SLOT_LABEL.weapon}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <LoadoutSlotPicker
            kind="other"
            selectedKey={loadout.other}
            options={otherOptions}
            open={openSlot === 'other'}
            onOpenChange={(next) => setOpenSlot(next ? 'other' : null)}
            onSelect={(k) => setSlot('other', k)}
          />
          <span className={`text-[10px] ${SLOT_LABEL_CLASS.other}`}>{SLOT_LABEL.other}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <LoadoutSlotPicker
            kind="skillA"
            selectedKey={loadout.skillA}
            options={skillOptions}
            open={openSlot === 'skillA'}
            onOpenChange={(next) => setOpenSlot(next ? 'skillA' : null)}
            onSelect={(k) => setSlot('skillA', k)}
          />
          <span className={`text-[10px] ${SLOT_LABEL_CLASS.skillA}`}>{SLOT_LABEL.skillA}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <LoadoutSlotPicker
            kind="skillB"
            selectedKey={loadout.skillB}
            options={skillOptions}
            open={openSlot === 'skillB'}
            onOpenChange={(next) => setOpenSlot(next ? 'skillB' : null)}
            onSelect={(k) => setSlot('skillB', k)}
          />
          <span className={`text-[10px] ${SLOT_LABEL_CLASS.skillB}`}>{SLOT_LABEL.skillB}</span>
        </div>
      </div>
    </section>
  );
}
