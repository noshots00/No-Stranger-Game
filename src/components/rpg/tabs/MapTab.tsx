import { AIRSHIP_FLAG, SILVER_LAKE_FLAG } from '../constants';

type MapTabProps = {
  currentLocation: string;
  forestSubLocation?: string | null;
  flags: string[];
  onLocationChange: (location: string) => void;
  /** After “You meet a merchant” quest, enables travel UI to the forest merchant. */
  merchantTravelUnlocked?: boolean;
  /** Quest 3 unveiled — show Old Well under The Forest. */
  oldWellTravelUnlocked?: boolean;
  /** “New” pings until each forest menu entry is selected. */
  forestTravelPings?: { forest: boolean; oldWell: boolean };
};

function MapNewDot() {
  return (
    <span
      className="ml-2 inline-block size-1.5 shrink-0 rounded-full bg-[var(--candle-flame-soft)] shadow-[0_0_6px_rgba(230,161,87,0.55)]"
      aria-hidden
    />
  );
}

export function MapTab({
  currentLocation,
  forestSubLocation = null,
  flags,
  onLocationChange,
  merchantTravelUnlocked,
  oldWellTravelUnlocked,
  forestTravelPings,
}: MapTabProps) {
  return (
    <section className="space-y-8 pb-4">
      <div className="rounded-lg border border-dashed border-[var(--candle-rule)] bg-black/25 px-4 py-6 text-center">
        <p className="font-cormorant text-2xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
          Coming Soon!
        </p>
        <p className="mt-2 font-serif text-sm text-[var(--candle-ink-soft)]">
          The world map is not yet connected to your journey.
        </p>
      </div>
      <div>
        <button
          type="button"
          onClick={() => onLocationChange('Forest')}
          className={`inline-flex max-w-full items-center font-cormorant text-left text-3xl font-semibold tracking-[0.02em] transition-colors ${
            currentLocation === 'Forest'
              ? 'border-b border-[var(--candle-flame-soft)] text-[var(--candle-ink)]'
              : 'border-b border-transparent text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]'
          }`}
        >
          <span>The Forest</span>
          {forestTravelPings?.forest ? <MapNewDot /> : null}
        </button>
        {oldWellTravelUnlocked ? (
          <div className="mt-3 pl-5">
            <button
              type="button"
              onClick={() => onLocationChange('Old Well')}
              className={`inline-flex max-w-full items-center font-cormorant text-left text-2xl font-medium tracking-[0.02em] transition-colors ${
                forestSubLocation === 'Old Well'
                  ? 'border-b border-[var(--candle-flame-soft)] text-[var(--candle-ink)]'
                  : 'border-b border-transparent text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]'
              }`}
            >
              <span>Old Well</span>
              {forestTravelPings?.oldWell ? <MapNewDot /> : null}
            </button>
          </div>
        ) : null}
      </div>
      {merchantTravelUnlocked ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onLocationChange('Merchant')}
            className={`font-cormorant text-left text-2xl font-medium tracking-[0.02em] transition-colors ${
              currentLocation === 'Merchant'
                ? 'border-b border-[var(--candle-flame-soft)] text-[var(--candle-ink)]'
                : 'border-b border-transparent text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]'
            }`}
          >
            Merchant camp
          </button>
        </div>
      ) : null}
      {flags.includes(SILVER_LAKE_FLAG) || flags.includes(AIRSHIP_FLAG) ? (
        <ul className="space-y-4 border-t border-[var(--candle-rule)] pt-6">
          {flags.includes(SILVER_LAKE_FLAG) ? (
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
          ) : null}
          {flags.includes(AIRSHIP_FLAG) ? (
            <li>
              <button
                type="button"
                onClick={() => onLocationChange('Airship')}
                className={`font-cormorant text-left text-2xl font-medium tracking-[0.02em] transition-colors ${
                  currentLocation === 'Airship'
                    ? 'border-b border-[var(--candle-flame-soft)] text-[var(--candle-ink)]'
                    : 'border-b border-transparent text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]'
                }`}
              >
                Airship
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}
