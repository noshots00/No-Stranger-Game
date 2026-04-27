import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameMapProps {
  discoveredLocations?: string[];
  glimmerLocationIds?: string[];
}

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

export function GameMap({ discoveredLocations = [], glimmerLocationIds = [] }: GameMapProps) {
  const known = new Set(discoveredLocations);
  const glimmers = new Set(glimmerLocationIds);

  const points = [
    { id: 'market-square', label: 'Village square', symbol: 'V' },
    { id: 'old-library', label: 'Old library', symbol: 'L' },
    { id: 'coin-vault', label: 'Coin vault', symbol: 'C' },
    { id: 'silent-alley', label: 'Silent alley', symbol: 'A' },
    { id: 'forest-edge', label: 'Forest edge', symbol: 'F' },
  ];

  return (
    <Card className="border-zinc-700/60 bg-zinc-900/60 text-zinc-100">
      <CardHeader>
        <CardTitle>Map</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 p-3 overflow-x-auto">
          <pre className="text-[11px] leading-4 text-zinc-200 font-mono whitespace-pre min-w-[620px]">
            {BASE_MAP}
          </pre>
        </div>
        <p className="text-zinc-400 text-sm font-serif">
          The village rests at the forest edge. Some paths are yours. Some only shimmer from afar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {points.map((point) => {
            const isKnown = known.has(point.id);
            const isGlimmer = !isKnown && glimmers.has(point.id);
            return (
              <div
                key={point.id}
                className={`rounded border p-2 text-sm ${
                  isKnown
                    ? 'border-emerald-700/70 bg-emerald-950/20 text-emerald-200'
                    : isGlimmer
                      ? 'border-amber-700/70 bg-amber-950/20 text-amber-200'
                      : 'border-zinc-700/70 bg-zinc-800/40 text-zinc-400'
                }`}
              >
                <span className="font-mono">{point.symbol}</span> {point.label}
                <span className="ml-2 text-xs font-mono">
                  {isKnown ? 'DISCOVERED' : isGlimmer ? 'GLIMMER' : 'LOCKED'}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}