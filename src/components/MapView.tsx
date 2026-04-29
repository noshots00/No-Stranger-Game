import { useState } from 'react';

export type LocationStatus = 'locked' | 'available' | 'visited' | 'new';

export interface MapLocation {
  id: string;
  name: string;
  icon: string;
  status: LocationStatus;
  notification?: boolean;
  discovered?: boolean;
  description?: string;
  subLocations?: MapLocation[];
}

interface MapViewProps {
  locations: MapLocation[];
  onTravel: (locationId: string) => void;
  isTutorialPhase: boolean;
}

export default function MapView({ locations, onTravel, isTutorialPhase }: MapViewProps) {
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [infoTarget, setInfoTarget] = useState<MapLocation | null>(null);

  const handleLocationClick = (loc: MapLocation) => {
    if (loc.status === 'locked') return;

    // If it has sub-locations, toggle expand
    if (loc.subLocations?.length) {
      setExpandedParent(expandedParent === loc.id ? null : loc.id);
      setInfoTarget(null);
      return;
    }

    // For undiscovered locations, trigger discover immediately
    if (!loc.discovered && loc.status === 'new') {
      onTravel(loc.id);
      return;
    }

    // Show info tooltip for discovered activities
    if (loc.description) {
      setInfoTarget(infoTarget?.id === loc.id ? null : loc);
      return;
    }

    onTravel(loc.id);
  };

  const handleSubClick = (sub: MapLocation) => {
    if (sub.status === 'locked') return;

    // Undiscovered sub-location: discover it
    if (!sub.discovered) {
      onTravel(sub.id);
      setInfoTarget(null);
      return;
    }

    // Discovered: show info or travel
    if (sub.description) {
      setInfoTarget(infoTarget?.id === sub.id ? null : sub);
    } else {
      onTravel(sub.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-stone-200 overflow-y-auto px-4 py-5 scroll-smooth">
      <header className="mb-6 pb-3 border-b border-stone-800">
        <h1 className="text-xl font-serif text-amber-50 tracking-wide">Regional Map</h1>
        <p className="text-xs text-stone-500 font-mono mt-1">
          {isTutorialPhase ? 'Tutorial: Select a destination to proceed' : 'Explore. Discover. Unlock.'}
        </p>
      </header>

      {infoTarget && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg animate-fadeIn">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{infoTarget.icon}</span>
            <span className="text-sm font-serif text-amber-200">{infoTarget.name}</span>
          </div>
          <p className="text-xs text-stone-300">{infoTarget.description}</p>
          <button
            onClick={() => setInfoTarget(null)}
            className="mt-2 text-[10px] font-mono text-stone-500 hover:text-stone-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-3 flex-1">
        {locations.map((loc) => {
          const hasNotification = loc.notification || loc.subLocations?.some((s) => s.notification);
          return (
            <div key={loc.id} className="relative">
              <button
                onClick={() => handleLocationClick(loc)}
                disabled={loc.status === 'locked'}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                  loc.status === 'locked'
                    ? 'bg-stone-900/20 border-stone-900 text-stone-600 cursor-not-allowed'
                    : loc.status === 'visited'
                      ? 'bg-stone-900/40 border-stone-800 text-stone-300'
                      : hasNotification
                        ? 'bg-stone-900/60 border-amber-800/60 ring-1 ring-amber-700/30 text-amber-100'
                        : 'bg-stone-900/50 border-stone-800 text-stone-200 hover:border-stone-700'
                }`}
              >
                <span className="text-2xl opacity-80">{loc.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif tracking-wide">{loc.name}</span>
                    {hasNotification && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  </div>
                  <p className="text-[10px] font-mono text-stone-500 mt-0.5 capitalize">
                    {loc.status === 'locked' ? 'Unexplored' : loc.status === 'new' && !loc.discovered ? 'Discover' : loc.status}
                  </p>
                </div>
                {loc.subLocations?.length ? (
                  <span className="text-stone-600 text-lg">{expandedParent === loc.id ? '▾' : '▸'}</span>
                ) : null}
              </button>

              {loc.subLocations?.length && expandedParent === loc.id && (
                <div className="ml-6 mt-2 pl-4 border-l-2 border-stone-800 space-y-2 animate-fadeIn">
                  {loc.subLocations.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubClick(sub)}
                      disabled={sub.status === 'locked'}
                      className={`w-full flex items-center gap-3 p-3 rounded border text-left transition-all ${
                        sub.status === 'locked'
                          ? 'opacity-40 border-stone-900 cursor-not-allowed'
                          : sub.notification
                            ? 'bg-stone-900/50 border-amber-800/40 text-amber-100'
                            : 'bg-stone-950/50 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <span className="text-lg">{sub.icon}</span>
                      <span className="flex-1 font-mono text-sm">{sub.name}</span>
                      {sub.notification && <span className="text-xs text-amber-400 font-mono">!</span>}
                      {!sub.discovered && sub.status !== 'locked' && (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-900/30 px-1.5 py-0.5 rounded">Discover</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
