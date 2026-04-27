const BASE_MAP = String.raw`
                    .  .      ^^^^^^^      .    .
                 .        ^^^^#####^^^^           .
              .      ^^^^###########^^^^      .      .
                   ^^^#########F########^^^
                 ^^##########FFFFF########^^
               ^^###########FFTTTFF#########^^
      ~~~~~~~~^##############FTTTTF############^~~~~~~~
      ~ RIVER ~~~~~~        FTTTTTF       ~~~~~~ RIVER ~
      ~~~~~~~~      \       FTTTTTF      /      ~~~~~~~~
                      \_____[GATE]______/ 
                           ||   ||
                        ___||___||___
                       /   /  V  \   \
                      / H / [S]  \ I  \
                     /___/___+____\___\
                        |   [WELL]   |
                        |      K      |
                        |      C      |
                        +------R------+
                               |
                          road to marsh
`;

interface TerritoryViewProps {
  discoveredLocations: string[];
  glimmerLocationIds: string[];
}

const points = [
  { id: 'market-square', label: 'Village square' },
  { id: 'old-library', label: 'Old library' },
  { id: 'coin-vault', label: 'Coin vault' },
  { id: 'silent-alley', label: 'Silent alley' },
  { id: 'forest-edge', label: 'Forest edge' },
];

export function TerritoryView({ discoveredLocations, glimmerLocationIds }: TerritoryViewProps) {
  const known = new Set(discoveredLocations);
  const glimmers = new Set(glimmerLocationIds);

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <p className="text-xs tracking-[0.2em] uppercase mb-6 emerge" style={{ color: 'var(--ink-ghost)' }}>
        The Territory
      </p>

      <div className="rounded-xl p-4 md:p-6 overflow-x-auto emerge" style={{ background: 'var(--surface)' }}>
        <pre className="text-[11px] leading-[18px] font-mono whitespace-pre min-w-[600px]" style={{ color: 'var(--ink-dim)' }}>
          {BASE_MAP}
        </pre>
      </div>

      <div className="mt-8 space-y-2 emerge emerge-delay-1">
        {points.map((point) => {
          const isKnown = known.has(point.id);
          const isGlimmer = !isKnown && glimmers.has(point.id);
          if (!isKnown && !isGlimmer) return null;
          return (
            <p key={point.id} className={`font-cormorant text-sm ${isGlimmer ? 'flicker' : ''}`} style={{ color: isKnown ? 'var(--ink)' : 'var(--mist)' }}>
              {isKnown ? '◆' : '◇'} {point.label}
              {isGlimmer ? <span className="ml-2 text-xs italic">— glimpsed, not reached</span> : null}
            </p>
          );
        })}
      </div>

      <p className="mt-6 font-cormorant text-sm italic emerge emerge-delay-2" style={{ color: 'var(--ink-ghost)' }}>
        Some paths are yours. Some only shimmer from afar.
      </p>
    </div>
  );
}
