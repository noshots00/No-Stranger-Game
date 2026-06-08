import { cn } from '@/lib/utils';
import { formatBlobbiIdentitySubtitle } from './blobbiDisplay';
import type { BlobbiSnapshot } from './blobbiStateNostr';

type BlobbiFightCardProps = {
  blobbi: Pick<
    BlobbiSnapshot,
    'displayName' | 'stage' | 'size' | 'health' | 'hunger' | 'happiness' | 'hygiene' | 'energy'
  >;
  ownerName?: string;
  className?: string;
  queueStatus?: 'waiting';
  /** Match board expansions — HP only, no vitals line clutter. */
  compact?: boolean;
};

export function BlobbiFightCard({
  blobbi,
  ownerName,
  className,
  queueStatus,
  compact = false,
}: BlobbiFightCardProps) {
  const identityMeta = formatBlobbiIdentitySubtitle({
    stage: blobbi.stage,
    size: blobbi.size,
    ownerName,
  });

  return (
    <div
      className={cn(
        'relative min-w-0 rounded-sm bg-gradient-to-br from-black/35 via-black/20 to-[var(--candle-flame)]/[0.07] px-2 py-1',
        queueStatus === 'waiting' && 'pr-[7.5rem]',
        className
      )}
    >
      {queueStatus === 'waiting' ? (
        <span className="absolute right-1.5 top-1 max-w-[7rem] text-right rpg-font-ui text-[9px] leading-tight tracking-[0.06em] text-emerald-400/95">
          Waiting for opponent
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="rpg-display truncate text-[14px] leading-tight text-[var(--candle-wax)]">
          {blobbi.displayName}
        </p>
        {identityMeta ? (
          <p className="rpg-font-ui truncate text-[13px] leading-tight text-[var(--candle-ink-soft)]">
            {identityMeta}
          </p>
        ) : null}
      </div>

      <p className="rpg-font-ui mt-0.5 truncate text-[10px] leading-tight tracking-wide text-[var(--candle-ink-faint)]">
        <span className="font-medium tabular-nums text-[var(--candle-flame-soft)]">
          HP {blobbi.health}
        </span>
        {!compact ? (
          <span>
            {' '}
            · Hun {blobbi.hunger} · Hap {blobbi.happiness} · Hyg {blobbi.hygiene} · En{' '}
            {blobbi.energy}
          </span>
        ) : null}
      </p>
    </div>
  );
}
