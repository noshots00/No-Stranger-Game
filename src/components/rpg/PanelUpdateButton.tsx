import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { RPG_UI_CAPTION } from './typography/rpgUiTypography';
import { VillageActionChip, VillageActionRow, VillageActionRowItem } from './village/VillageActionChip';

type PanelUpdateButtonProps = {
  label: string;
  onClick: () => void;
  /** Optional first-visit hint (hidden once ledger data has loaded). */
  showLedgerHint?: boolean;
  className?: string;
  /** Legacy dialog panels: full-width bar. Embedded village uses chip (default). */
  variant?: 'chip' | 'full';
};

/** Manual ledger refresh — no loading spinner; cached data stays visible during refetch. */
export function PanelUpdateButton({
  label,
  onClick,
  showLedgerHint = false,
  className,
  variant = 'chip',
}: PanelUpdateButtonProps) {
  if (variant === 'full') {
    return (
      <div className={cn('shrink-0 space-y-1', className)}>
        {showLedgerHint ? (
          <p className={RPG_UI_CAPTION}>Tap Update to load from the village ledger.</p>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full font-serif text-xs uppercase tracking-[0.1em]"
          onClick={onClick}
        >
          {label}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('shrink-0 space-y-0.5', className)}>
      {showLedgerHint ? (
        <p className={RPG_UI_CAPTION}>Tap Update to load from the village ledger.</p>
      ) : null}
      <VillageActionRow>
        <VillageActionRowItem>
          <VillageActionChip onClick={onClick}>{label}</VillageActionChip>
        </VillageActionRowItem>
      </VillageActionRow>
    </div>
  );
}
