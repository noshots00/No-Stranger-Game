import { useState } from 'react';

export type LocationStatus = 'locked' | 'available' | 'visited' | 'new';

export interface MapLocation {
  id: string;
  name: string;
  icon: string;
  status: LocationStatus;
  notification?: boolean;
  subLocations?: MapLocation[];
}

interface MapViewProps {
  locations: MapLocation[];
  onTravel: (locationId: string) => void;
  isTutorialPhase: boolean;
}

export default function MapView({ locations, onTravel, isTutorialPhase }: MapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const handleSelect = (loc: MapLocation) => {
    if (loc.status === 'locked') return;
    if (loc.subLocations?.length && expandedParent !== loc.id) {
      setExpandedParent(loc.id);
      return;
    }
    setSelectedLocation(loc);
  };

  const confirmTravel = () => {
    if (!selectedLocation) return;
    onTravel(selectedLocation.id);
    setSelectedLocation(null);
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-stone-200 overflow-y-auto px-4 py-5 scroll-smooth">
      <header className="mb-6 pb-3 border-b border-stone-800">
        <h1 className="text-xl font-serif text-amber-50 tracking-wide">Regional Map</h1>
        <p className="text-xs text-stone-500 font-mono mt-1">
          {isTutorialPhase ? 'Tutorial: Select a destination to proceed' : 'Explore. Discover. Unlock.'}
        </p>
      </header>

      <div className="space-y-3 flex-1">
        {locations.map((loc) => (
          <div key={loc.id} className="relative">
            <button
              onClick={() => handleSelect(loc)}
              disabled={loc.status === 'locked'}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                loc.status === 'locked'
                  ? 'bg-stone-900/20 border-stone-900 text-stone-600 cursor-not-allowed'
                  : loc.status === 'visited'
                    ? 'bg-stone-900/40 border-stone-800 text-stone-300'
                    : loc.notification
                      ? 'bg-stone-900/60 border-amber-800/60 ring-1 ring-amber-700/30 text-amber-100'
                      : 'bg-stone-900/50 border-stone-800 text-stone-200 hover:border-stone-700'
              }`}
            >
              <span className="text-2xl opacity-80">{loc.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif tracking-wide">{loc.name}</span>
                  {loc.notification && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                </div>
                <p className="text-[10px] font-mono text-stone-500 mt-0.5 capitalize">
                  {loc.status === 'locked' ? 'Unexplored' : loc.status === 'new' ? 'New Discovery' : loc.status}
                </p>
              </div>
              <span className="text-stone-600 text-lg">{expandedParent === loc.id ? '▾' : '▸'}</span>
            </button>

            {loc.subLocations?.length && expandedParent === loc.id && (
              <div className="ml-6 mt-2 pl-4 border-l-2 border-stone-800 space-y-2 animate-fadeIn">
                {loc.subLocations.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedLocation(sub)}
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
                    {sub.notification && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedLocation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fadeIn pb-[calc(76px+env(safe-area-inset-bottom,0px)+0.5rem)] sm:pb-0">
          <div className="w-full sm:max-w-sm bg-stone-900 border border-stone-700 rounded-t-xl sm:rounded-xl p-5 shadow-2xl animate-slideUp max-h-[min(78dvh,560px)] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{selectedLocation.icon}</span>
              <h3 className="text-lg font-serif text-amber-50">{selectedLocation.name}</h3>
            </div>
            <p className="text-sm text-stone-400 mb-6">
              {isTutorialPhase
                ? 'The path ahead is uncertain. Proceed carefully.'
                : 'Your character will travel here. Return tomorrow to see what they found.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSelectedLocation(null)} className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 font-mono text-sm">
                Cancel
              </button>
              <button onClick={confirmTravel} className="flex-1 py-3 px-4 bg-amber-700 hover:bg-amber-600 rounded-lg text-stone-950 font-semibold active:scale-[0.98]">
                Travel To
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
