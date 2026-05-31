import { cn } from '@/lib/utils';
import type { CoinSplit } from './helpers';

type CoinAmountDisplayProps = {
  split: CoinSplit;
  className?: string;
};

/** Compact wallet line: colored `0g 0s 0c` (always three slots). */
export function CoinAmountDisplay({ split, className }: CoinAmountDisplayProps) {
  return (
    <span className={cn('font-mono tabular-nums leading-tight', className)}>
      <span className="rpg-coin-gold">{split.gold}g</span>{' '}
      <span className="rpg-coin-silver">{split.silver}s</span>{' '}
      <span className="rpg-coin-copper">{split.copper}c</span>
    </span>
  );
}
