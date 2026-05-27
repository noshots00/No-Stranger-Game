import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type VillagePlaySurfaceProps = {
  onOpenArena: () => void;
  onOpenGuildAlley: () => void;
  onOpenTavern: () => void;
  onOpenMarket: () => void;
  onOpenMayorsHut: () => void;
  onOpenCraftersCorner: () => void;
  onOpenJobsHall: () => void;
  onOpenVillageProjects: () => void;
  onReturnToForest: () => void;
};

const PLACEHOLDER_BUILDINGS = [
  'Mayors Hut',
  'Market',
  "Crafter's Corner",
  'Tavern',
  'Guild Alley',
  'Arena',
] as const;

type VillageBuilding = (typeof PLACEHOLDER_BUILDINGS)[number];

/** Dark translucent tints — one mood per plot, candlelit palette. */
const VILLAGE_BUILDING_STYLES: Record<
  VillageBuilding,
  { bg: string; border: string; hoverBg: string; hoverBorder: string }
> = {
  'Mayors Hut': {
    bg: 'bg-[rgba(58,48,72,0.58)]',
    border: 'border-[rgba(130,108,158,0.28)]',
    hoverBg: 'hover:bg-[rgba(68,56,84,0.68)]',
    hoverBorder: 'hover:border-[rgba(150,128,178,0.42)]',
  },
  Market: {
    bg: 'bg-[rgba(72,52,28,0.55)]',
    border: 'border-[rgba(180,130,60,0.26)]',
    hoverBg: 'hover:bg-[rgba(82,60,32,0.65)]',
    hoverBorder: 'hover:border-[rgba(200,150,72,0.4)]',
  },
  "Crafter's Corner": {
    bg: 'bg-[rgba(48,42,32,0.58)]',
    border: 'border-[rgba(140,108,72,0.26)]',
    hoverBg: 'hover:bg-[rgba(58,50,38,0.68)]',
    hoverBorder: 'hover:border-[rgba(168,128,88,0.4)]',
  },
  Tavern: {
    bg: 'bg-[rgba(62,32,36,0.58)]',
    border: 'border-[rgba(150,72,82,0.28)]',
    hoverBg: 'hover:bg-[rgba(72,38,44,0.68)]',
    hoverBorder: 'hover:border-[rgba(178,88,98,0.42)]',
  },
  'Guild Alley': {
    bg: 'bg-[rgba(32,44,58,0.58)]',
    border: 'border-[rgba(72,108,140,0.28)]',
    hoverBg: 'hover:bg-[rgba(38,52,68,0.68)]',
    hoverBorder: 'hover:border-[rgba(92,132,168,0.42)]',
  },
  Arena: {
    bg: 'bg-[rgba(58,28,28,0.58)]',
    border: 'border-[rgba(140,68,58,0.28)]',
    hoverBg: 'hover:bg-[rgba(68,34,34,0.68)]',
    hoverBorder: 'hover:border-[rgba(168,82,68,0.42)]',
  },
};

export function VillagePlaySurface({
  onOpenArena,
  onOpenGuildAlley,
  onOpenTavern,
  onOpenMarket,
  onOpenMayorsHut,
  onOpenCraftersCorner,
  onOpenJobsHall,
  onOpenVillageProjects,
  onReturnToForest,
}: VillagePlaySurfaceProps) {
  const { toast } = useToast();

  const onBuildingStub = useCallback(
    (label: string) => {
      toast({ title: label, description: 'Visiting this building is not implemented yet.' });
    },
    [toast]
  );

  return (
    <section
      className="relative isolate flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-1"
      aria-label="Village hub"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-lg border border-[var(--candle-rule)] bg-gradient-to-b from-[var(--candle-hearth)] via-black/35 to-black/55" />
      <header className="shrink-0 space-y-1.5">
        <h2 className="text-center font-cormorant text-base font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
          Strange Village
        </h2>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenJobsHall}
            className="rounded-md border border-[var(--candle-rule)] bg-black/30 px-3 py-1.5 font-serif text-xs uppercase tracking-[0.1em] text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]"
          >
            Jobs Hall
          </button>
          <button
            type="button"
            onClick={onOpenVillageProjects}
            className="rounded-md border border-[var(--candle-rule)] bg-black/30 px-3 py-1.5 font-serif text-xs uppercase tracking-[0.1em] text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={onReturnToForest}
            className="rounded-md border border-[var(--candle-flame-soft)]/35 bg-[var(--candle-flame)]/10 px-3 py-1.5 font-serif text-xs uppercase tracking-[0.1em] text-[var(--candle-wax)] hover:bg-[var(--candle-flame)]/20"
          >
            Return to Forest
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PLACEHOLDER_BUILDINGS.map((label) => {
          const plot = VILLAGE_BUILDING_STYLES[label];
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (label === 'Arena') onOpenArena();
                else if (label === 'Guild Alley') onOpenGuildAlley();
                else if (label === 'Tavern') onOpenTavern();
                else if (label === 'Market') onOpenMarket();
                else if (label === 'Mayors Hut') onOpenMayorsHut();
                else if (label === "Crafter's Corner") onOpenCraftersCorner();
                else onBuildingStub(label);
              }}
              className={cn(
                'min-h-[44px] rounded-md border px-1 py-2 font-serif text-[0.65rem] uppercase leading-tight tracking-[0.12em] text-[var(--candle-ink-soft)] backdrop-blur-[2px] transition-colors hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--candle-flame-soft)]',
                plot.bg,
                plot.border,
                plot.hoverBg,
                plot.hoverBorder
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
