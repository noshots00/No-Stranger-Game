import { useState } from 'react';

interface TerritoryViewProps {
  discoveredLocations: string[];
  glimmerLocationIds: string[];
  level?: number;
  visibleTraits?: string[];
  onExplore?: (intent: string) => void;
}

const REGIONS = [
  {
    id: 'dawnharbor',
    name: 'Dawnharbor',
    locations: [
      { id: 'market-square', label: 'Village Square' },
      { id: 'blackfoot-woods', label: 'Blackfoot Woods' },
      { id: 'tanner-row', label: 'Tanner Row' },
    ],
  },
  {
    id: 'outer-rim',
    name: 'Outer Rim',
    locations: [
      { id: 'old-library', label: 'Old Library' },
      { id: 'forest-edge', label: 'Forest Edge' },
      { id: 'sunken-library', label: 'Sunken Library' },
    ],
  },
];

const baseActions = ['Hunt', 'Forage', 'Trade', 'Socialize'];

export function TerritoryView({ discoveredLocations, glimmerLocationIds, level = 1, visibleTraits = [], onExplore }: TerritoryViewProps) {
  const known = new Set(discoveredLocations);
  const glimmers = new Set(glimmerLocationIds);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const unlockedActionsFor = (locationId: string): string[] => {
    const actions = [...baseActions];
    if (level >= 2) actions.push('Settle Camp');
    if (visibleTraits.includes('Hunter')) actions.push('Track Rare Game');
    if (locationId === 'sunken-library' && level >= 3) actions.push('Recover Lost Ledger (Quest)');
    if (locationId === 'blackfoot-woods' && visibleTraits.includes('Hunter')) actions.push('Collect 15 Pristine Pelts (Quest)');
    return actions;
  };

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <p className="text-xs tracking-[0.2em] uppercase mb-6 emerge" style={{ color: 'var(--ink-ghost)' }}>
        The Territory
      </p>

      <div className="rounded-xl p-4 emerge space-y-4" style={{ background: 'var(--surface)' }}>
        {REGIONS.map((region) => {
          const visibleLocations = region.locations.filter((location) => known.has(location.id) || glimmers.has(location.id));
          if (visibleLocations.length === 0) return null;
          return (
            <div key={region.id} className="space-y-2">
              <p className="text-xs tracking-[0.18em] uppercase" style={{ color: 'var(--ink-ghost)' }}>{region.name}</p>
              {visibleLocations.map((location) => {
                const isKnown = known.has(location.id);
                const actions = unlockedActionsFor(location.id);
                const hasNewUnlock = actions.length > baseActions.length;
                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => setSelectedLocationId((prev) => (prev === location.id ? null : location.id))}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left"
                    style={{ background: 'var(--surface-dim)' }}
                  >
                    <span className="font-cormorant text-sm" style={{ color: isKnown ? 'var(--ink)' : 'var(--mist)' }}>
                      {isKnown ? '◆' : '◇'} {location.label}
                    </span>
                    {hasNewUnlock ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--ember)', color: 'var(--void)' }}>
                        New
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {selectedLocationId ? (
        <div className="mt-4 rounded-xl p-4 space-y-2" style={{ background: 'var(--surface-dim)' }}>
          <p className="text-xs tracking-[0.18em] uppercase" style={{ color: 'var(--ink-ghost)' }}>
            Available Actions
          </p>
          {unlockedActionsFor(selectedLocationId).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onExplore?.(`${action} at ${selectedLocationId}`)}
              className="w-full text-left px-3 py-2 rounded-md font-cormorant text-sm"
              style={{ color: 'var(--ink)', background: 'var(--surface)' }}
            >
              {action}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mt-6 font-cormorant text-sm italic emerge emerge-delay-2" style={{ color: 'var(--ink-ghost)' }}>
        Some paths are yours. Some only shimmer from afar.
      </p>
      {onExplore ? null : null}
    </div>
  );
}
