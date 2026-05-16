import { useCallback } from 'react';
import { locationActions } from '../constants';
import { useToast } from '@/hooks/useToast';

type VillagePlaySurfaceProps = {
  dayCounter: number;
  characterNameLabel: string;
};

const PLACEHOLDER_BUILDINGS = ['Hall', 'Market', 'Forge'] as const;

export function VillagePlaySurface({ dayCounter, characterNameLabel }: VillagePlaySurfaceProps) {
  const { toast } = useToast();
  const villageActions = locationActions.Village ?? [];

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
      <header className="shrink-0 space-y-1 text-center">
        <p className="font-serif text-xs uppercase tracking-[0.2em] text-[var(--candle-ink-faint)]">Endgame hub</p>
        <h2 className="font-cormorant text-xl font-semibold tracking-wide text-[var(--candle-wax)]">{characterNameLabel}</h2>
        <p className="mx-auto max-w-sm font-serif text-sm italic text-[var(--candle-ink-soft)]">
          Day {dayCounter}. Building interactions and village mechanics are coming next—explore the placeholders below.
        </p>
      </header>

      <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-lg border border-[var(--candle-rule)]/80 bg-black/25">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 320 220"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="villageRoof" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(90,75,95,0.55)" />
              <stop offset="100%" stopColor="rgba(40,35,48,0.75)" />
            </linearGradient>
            <linearGradient id="villageWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(84,78,92,0.5)" />
              <stop offset="100%" stopColor="rgba(44,40,52,0.65)" />
            </linearGradient>
          </defs>
          <polygon points="40,120 120,120 100,70 60,70" fill="url(#villageRoof)" stroke="rgba(230,161,87,0.25)" strokeWidth="1" />
          <polygon points="50,120 110,120 110,165 50,165" fill="url(#villageWall)" stroke="rgba(230,161,87,0.2)" strokeWidth="1" />
          <polygon points="130,130 210,130 190,85 150,85" fill="url(#villageRoof)" stroke="rgba(230,161,87,0.25)" strokeWidth="1" />
          <polygon points="140,130 200,130 200,172 140,172" fill="url(#villageWall)" stroke="rgba(230,161,87,0.2)" strokeWidth="1" />
          <polygon points="220,118 290,118 275,78 238,78" fill="url(#villageRoof)" stroke="rgba(230,161,87,0.25)" strokeWidth="1" />
          <polygon points="232,118 282,118 282,168 232,168" fill="url(#villageWall)" stroke="rgba(230,161,87,0.2)" strokeWidth="1" />
          <polygon points="100,175 180,175 165,150 118,150" fill="rgba(55,50,62,0.6)" stroke="rgba(230,161,87,0.18)" strokeWidth="1" />
          <polygon points="110,175 170,175 170,205 110,205" fill="rgba(46,42,54,0.65)" stroke="rgba(230,161,87,0.15)" strokeWidth="1" />
          <line x1="0" y1="205" x2="320" y2="205" stroke="rgba(230,161,87,0.12)" strokeWidth="1" />
        </svg>

        <div className="relative z-[1] flex h-full min-h-[200px] flex-col justify-end gap-2 p-2">
          <div className="grid grid-cols-3 gap-2">
            {PLACEHOLDER_BUILDINGS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => onBuildingStub(label)}
                className="min-h-[44px] rounded-md border border-[var(--candle-rule)] bg-black/50 px-1 py-2 font-serif text-[0.65rem] uppercase leading-tight tracking-[0.12em] text-[var(--candle-ink-soft)] transition-colors hover:border-[var(--candle-flame-soft)] hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--candle-flame-soft)]"
              >
                {label}
                <span className="mt-0.5 block text-[0.55rem] font-normal normal-case tracking-normal text-[var(--candle-ink-faint)]">
                  Plot {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {villageActions.length > 0 ? (
        <div className="shrink-0 space-y-2 border-t border-[var(--candle-rule)] pt-2">
          <p className="px-0.5 font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
            Street scenes (placeholder)
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {villageActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onBuildingStub(action)}
                className="min-h-[40px] rounded-lg border border-transparent px-2 py-2 text-left font-serif text-sm text-[var(--candle-ink-soft)] transition-colors hover:border-[var(--candle-rule)] hover:text-[var(--candle-ink)]"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
