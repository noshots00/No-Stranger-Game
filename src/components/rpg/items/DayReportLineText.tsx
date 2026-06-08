import { formatModifierKeyForCharacterSheet, toItemLabel } from '../helpers';
import { listEquipmentKeys } from '../combat/equipmentRegistry';
import { ItemName } from './ItemName';
import type { ItemNameCategory } from './itemDisplay';

function categoryForFoundLabel(label: string): ItemNameCategory {
  const lower = label.trim().toLowerCase();
  for (const key of listEquipmentKeys()) {
    if (toItemLabel(key).toLowerCase() === lower) return 'equipment';
    if (formatModifierKeyForCharacterSheet(key).toLowerCase() === lower) return 'equipment';
  }
  return 'material';
}

/** Day report bullet — color-codes item names inside standard gain/found lines. */
export function DayReportLineText({ text }: { text: string }) {
  const trimmed = text.trim();

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

  return <>{text}</>;
}
