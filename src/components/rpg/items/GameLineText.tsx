import type { ReactNode } from 'react';
import {
  formatModifierKeyForCharacterSheet,
  parseSpellLearnedLine,
  toItemLabel,
  DAY_REPORT_QUEST_ITEMS_PREFIX,
} from '../helpers';
import { listEquipmentKeys } from '../combat/equipmentRegistry';
import { SpellName } from '../spells/SpellName';
import { SpellNameInText } from '../spells/SpellNameInText';
import { ItemName, ItemNameList } from './ItemName';
import type { ItemNameCategory } from './itemDisplay';

function categoryForFoundLabel(label: string): ItemNameCategory {
  const lower = label.trim().toLowerCase();
  for (const key of listEquipmentKeys()) {
    if (toItemLabel(key).toLowerCase() === lower) return 'equipment';
    if (formatModifierKeyForCharacterSheet(key).toLowerCase() === lower) return 'equipment';
  }
  return 'material';
}

/** Day-report bullets with item/resource color coding; null when plain prose. */
export function renderDayReportLineContent(text: string): ReactNode | null {
  const trimmed = text.trim();

  const gainedItems = trimmed.startsWith(DAY_REPORT_QUEST_ITEMS_PREFIX)
    ? trimmed.slice(DAY_REPORT_QUEST_ITEMS_PREFIX.length)
    : null;
  if (gainedItems !== null) {
    const labels = gainedItems
      .split(', ')
      .map((label) => label.trim())
      .filter((label) => label.length > 0);
    return (
      <>
        {DAY_REPORT_QUEST_ITEMS_PREFIX}
        <ItemNameList items={labels.map((label) => ({ label, category: 'quest' }))} />
      </>
    );
  }

  const gained = /^You gained (\d+) (.+)\.$/.exec(trimmed);
  if (gained) {
    return (
      <>
        You gained {gained[1]} <ItemName label={gained[2]} category="material" />.
      </>
    );
  }

  const found = /^You found (\d+) (.+)\.$/.exec(trimmed);
  if (found) {
    return (
      <>
        You found {found[1]}{' '}
        <ItemName label={found[2]} category={categoryForFoundLabel(found[2])} />.
      </>
    );
  }

  if (trimmed && !trimmed.startsWith('You ') && !/^Day \d+/i.test(trimmed)) {
    return <ItemName label={trimmed} category="quest" />;
  }

  return null;
}

type GameLineTextProps = {
  text: string;
  playerName?: string;
};

/** Colored RPG log line — day-report gains, spell learned, then spell/player highlights. */
export function GameLineText({ text, playerName = '' }: GameLineTextProps) {
  const structured = renderDayReportLineContent(text);
  if (structured !== null) return structured;

  const spellName = parseSpellLearnedLine(text);
  if (spellName) {
    return (
      <>
        You learned <SpellName label={spellName} />!
      </>
    );
  }

  return <SpellNameInText text={text} playerName={playerName} />;
}

/** Day report bullet — alias for {@link GameLineText}. */
export function DayReportLineText({ text }: { text: string }) {
  return <GameLineText text={text} />;
}
