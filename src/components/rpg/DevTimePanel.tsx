interface DeltaSnapshot {
  goldDelta: number;
  healthDelta: number;
  fromLocation: string;
  toLocation: string;
}

interface DevTimePanelProps {
  enabled: boolean;
  onSkipDay: () => Promise<DeltaSnapshot | null>;
}

export function DevTimePanel({ enabled, onSkipDay }: DevTimePanelProps) {
  if (!enabled) return null;

  return (
    <div className="fixed right-3 bottom-24 z-50">
      <button
        type="button"
        className="rounded-md px-3 py-2 text-xs shadow-md"
        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--ink-ghost)' }}
        onClick={() => {
          onSkipDay().catch(() => {});
        }}
      >
        Dev: Skip 1 Day
      </button>
    </div>
  );
}

export type { DeltaSnapshot };
