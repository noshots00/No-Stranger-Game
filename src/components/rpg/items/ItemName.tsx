import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import {
  getItemCategoryFromKey,
  itemNameClassName,
  itemNameColorStyle,
  type ItemNameCategory,
} from './itemDisplay';

export type ItemNameProps = {
  label: string;
  itemKey?: string;
  category?: ItemNameCategory;
  className?: string;
};

export function ItemName({ label, itemKey, category, className }: ItemNameProps) {
  const resolved = category ?? (itemKey ? getItemCategoryFromKey(itemKey) : 'quest');
  return (
    <span
      className={cn(className, itemNameClassName(resolved))}
      style={itemNameColorStyle(resolved)}
    >
      {label}
    </span>
  );
}

type ItemNameListItem = {
  label: string;
  itemKey?: string;
  category?: ItemNameCategory;
};

export function ItemNameList({ items, className }: { items: ItemNameListItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <span className={className}>
      {items.map((item, index) => (
        <Fragment key={`${item.itemKey ?? item.label}-${index}`}>
          {index > 0 ? ', ' : null}
          <ItemName {...item} />
        </Fragment>
      ))}
    </span>
  );
}
