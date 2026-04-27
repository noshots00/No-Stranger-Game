interface TerritoryViewProps {
  discoveredLocations: string[];
  glimmerLocationIds: string[];
  onExplore?: (intent: string) => void;
}

const points = [
  { id: 'market-square', label: 'Village square' },
  { id: 'old-library', label: 'Old library' },
  { id: 'coin-vault', label: 'Coin vault' },
  { id: 'silent-alley', label: 'Silent alley' },
  { id: 'forest-edge', label: 'Forest edge' },
];

export function TerritoryView({ discoveredLocations, glimmerLocationIds, onExplore }: TerritoryViewProps) {
  const known = new Set(discoveredLocations);
  const glimmers = new Set(glimmerLocationIds);

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <p className="text-xs tracking-[0.2em] uppercase mb-6 emerge" style={{ color: 'var(--ink-ghost)' }}>
        The Territory
      </p>

      <div className="rounded-xl p-4 emerge space-y-2" style={{ background: 'var(--surface)' }}>
        {points.map((point) => {
          const isKnown = known.has(point.id);
          const isGlimmer = !isKnown && glimmers.has(point.id);
          if (!isKnown && !isGlimmer) return null;
          return (
            <div key={point.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface-dim)' }}>
              <span style={{ color: isKnown ? 'var(--ember)' : 'var(--mist)' }}>{isKnown ? '◆' : '◇'}</span>
              <span className="font-cormorant text-sm" style={{ color: isKnown ? 'var(--ink)' : 'var(--mist)' }}>
                {point.label}
              </span>
            </div>
          );
        })}
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
      {onExplore ? (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {[
            'Head north toward the old roads and guild posts',
            'Drift east where coin and rumor change hands',
            'Move south through marsh paths for survival work',
          ].map((intent) => (
            <button
              key={intent}
              type="button"
              className="font-cormorant text-sm text-left px-3 py-2 rounded-md transition-colors"
              style={{ color: 'var(--ember)', background: 'var(--surface-dim)' }}
              onClick={() => onExplore(intent)}
            >
              {intent}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
