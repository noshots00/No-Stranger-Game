import { BlobbiPortrait } from './BlobbiPortrait';
import type { BlobbiArenaRecord } from './blobbiCareerNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';

type BlobbiProfileCardProps = {
  blobbi: BlobbiSnapshot;
  arenaRecord: BlobbiArenaRecord;
};

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <p className="block leading-tight">
      <span className="text-[0.6rem] uppercase tracking-[0.08em] text-[var(--candle-ink-faint)]">
        {label}:{' '}
      </span>
      <span className="font-mono text-[0.65rem] text-[var(--candle-wax)]">{value}</span>
    </p>
  );
}

export function BlobbiProfileCard({ blobbi, arenaRecord }: BlobbiProfileCardProps) {
  const { wins, losses } = arenaRecord;

  return (
    <div className="character-profile-card mx-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-[var(--candle-flame-soft)] p-1.5">
      <div className="flex shrink-0 flex-col items-center">
        <div className="aspect-[200/266] w-[min(96px,28vw)] overflow-hidden rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-[var(--candle-rule)]">
          <div className="flex h-full w-full items-center justify-center bg-black/30">
            <BlobbiPortrait blobbi={blobbi} size="lg" />
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
        <p className="truncate font-serif text-[0.85rem] font-medium text-[var(--candle-wax)]">
          {blobbi.displayName}
        </p>
        <p className="font-mono text-[0.6rem] capitalize text-[var(--candle-ink-faint)]">
          {blobbi.stage}
          {blobbi.size ? ` · ${blobbi.size}` : ''}
        </p>
        <div className="mt-0.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
          <StatRow label="HP" value={blobbi.health} />
          <StatRow label="Hunger" value={blobbi.hunger} />
          <StatRow label="Happy" value={blobbi.happiness} />
          <StatRow label="Hygiene" value={blobbi.hygiene} />
          <StatRow label="Energy" value={blobbi.energy} />
          <StatRow label="Arena" value={`${wins}–${losses}`} />
        </div>
        {blobbi.pattern ? (
          <p className="font-mono text-[0.6rem] capitalize text-[var(--candle-ink-faint)]">
            {blobbi.pattern}
            {blobbi.specialMark && blobbi.specialMark !== 'none'
              ? ` · ${blobbi.specialMark}`
              : ''}
          </p>
        ) : null}
        {blobbi.personality ? (
          <p className="truncate font-serif text-[0.6rem] italic text-[var(--candle-ink-faint)]">
            {blobbi.personality}
          </p>
        ) : null}
      </div>
    </div>
  );
}
