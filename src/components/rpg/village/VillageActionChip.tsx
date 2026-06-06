import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { RPG_COMMAND_CHIP, RPG_COMMAND_CHIP_LABEL } from '../typography/rpgUiTypography';

type VillageActionChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Full-width chip in a choice grid row. */
  spanFull?: boolean;
};

export function VillageActionChip({
  children,
  className,
  spanFull = false,
  type = 'button',
  ...props
}: VillageActionChipProps) {
  return (
    <button type={type} className={cn(RPG_COMMAND_CHIP, spanFull && 'w-full', className)} {...props}>
      <span className={RPG_COMMAND_CHIP_LABEL}>{children}</span>
    </button>
  );
}

type VillageActionRowProps = {
  children: ReactNode;
  className?: string;
};

export function VillageActionRow({ children, className }: VillageActionRowProps) {
  return <ul className={cn('rpg-choice-grid list-none p-0 m-0', className)}>{children}</ul>;
}

export function VillageActionRowItem({
  children,
  spanFull = false,
}: {
  children: ReactNode;
  spanFull?: boolean;
}) {
  return <li className={spanFull ? 'rpg-choice-span-full' : undefined}>{children}</li>;
}
