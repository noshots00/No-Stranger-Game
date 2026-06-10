import { cn } from '@/lib/utils';
import { spellNameClassName, spellNameColorStyle } from './spellDisplay';

export type SpellNameProps = {
  label: string;
  className?: string;
};

export function SpellName({ label, className }: SpellNameProps) {
  return (
    <span className={cn(spellNameClassName(), className)} style={spellNameColorStyle()}>
      {label}
    </span>
  );
}
