import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { RPG_UI_CAPTION } from './typography/rpgUiTypography';
import { VillageActionChip, VillageActionRow, VillageActionRowItem } from './village/VillageActionChip';

type PanelUpdateButtonProps = {
  label: string;
  onClick: () => void;
  isFetching?: boolean;
  showLedgerHint?: boolean;
  className?: string;
  /** Legacy dialog panels: full-width bar. Embedded village uses chip (default). */
  variant?: 'chip' | 'full';
};

export function PanelUpdateButton({
  label,
  onClick,
  isFetching = false,
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
          disabled={isFetching}
          onClick={onClick}
        >
          {isFetching ? 'Updating…' : label}
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
          <VillageActionChip disabled={isFetching} onClick={onClick}>
            {isFetching ? 'Updating…' : label}
          </VillageActionChip>
        </VillageActionRowItem>
      </VillageActionRow>
    </div>
  );
}
