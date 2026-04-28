interface DeltaSnapshot {
  goldDelta: number;
  healthDelta: number;
  fromLocation: string;
  toLocation: string;
}

interface DevTimePanelProps {
  enabled: boolean;
  onSkipDays: (days: number) => Promise<DeltaSnapshot | null>;
}

export function DevTimePanel({ enabled, onSkipDays }: DevTimePanelProps) {
  if (!enabled) return null;

  return (
    <div className="fixed right-3 bottom-24 z-50 flex flex-col gap-2">
      {[1, 3, 7].map((days) => (
        <button
          key={days}
          type="button"
          className="rounded-md px-3 py-2 text-xs shadow-md"
          style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--ink-ghost)' }}
          onClick={() => {
            onSkipDays(days).catch(() => {});
          }}
        >
          Dev: Skip {days} Day{days === 1 ? '' : 's'}
        </button>
      ))}
    </div>
  );
}

export type { DeltaSnapshot };
