import { SILVER_LAKE_FLAG } from '../constants';

type MapTabProps = {
  currentLocation: string;
  flags: string[];
  onLocationChange: (location: string) => void;
};

export function MapTab({ currentLocation, flags, onLocationChange }: MapTabProps) {
  return (
    <section className="space-y-8 pb-4">
      <div>
        <button
          type="button"
          onClick={() => onLocationChange('Forest')}
          className={`font-cormorant text-left text-3xl font-semibold tracking-[0.02em] transition-colors ${
            currentLocation === 'Forest'
              ? 'border-b border-[var(--candle-flame-soft)] text-[var(--candle-ink)]'
              : 'border-b border-transparent text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]'
          }`}
        >
          The Forest
        </button>
      </div>
      {flags.includes(SILVER_LAKE_FLAG) ? (
        <ul className="space-y-4 border-t border-[var(--candle-rule)] pt-6">
          <li>
            <button
              type="button"
              onClick={() => onLocationChange('Silver Lake')}
              className={`font-cormorant text-left text-2xl font-medium tracking-[0.02em] transition-colors ${
                currentLocation === 'Silver Lake'
                  ? 'border-b border-[var(--candle-flame-soft)] text-[var(--candle-ink)]'
                  : 'border-b border-transparent text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]'
              }`}
            >
              Silver Lake
            </button>
          </li>
        </ul>
      ) : null}
    </section>
  );
}
