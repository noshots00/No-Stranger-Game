import { SILVER_LAKE_FLAG } from '../constants';

type MapTabProps = {
  currentLocation: string;
  flags: string[];
  onLocationChange: (location: string) => void;
};

export function MapTab({ currentLocation, flags, onLocationChange }: MapTabProps) {
  return (
    <section className="facsimile-panel space-y-4">
      <button
        type="button"
        onClick={() => onLocationChange('Forest')}
        className={`text-2xl font-semibold transition-colors ${
          currentLocation === 'Forest'
            ? 'text-[var(--facsimile-ink)]'
            : 'text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]'
        }`}
      >
        The Forest
      </button>
      <ul className="space-y-3 text-sm text-[var(--facsimile-ink-muted)]">
        {flags.includes(SILVER_LAKE_FLAG) ? (
          <li>
            <button
              type="button"
              onClick={() => onLocationChange('Silver Lake')}
              className={`w-full border-l border-amber-500/30 py-1 pl-8 text-left transition-colors ${
                currentLocation === 'Silver Lake'
                  ? 'text-[var(--facsimile-ink)]'
                  : 'text-[var(--facsimile-ink-muted)] hover:text-[var(--facsimile-ink)]'
              }`}
            >
              Silver Lake
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
