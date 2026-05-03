import { DialogueVoiceBlock } from '../DialogueVoiceBlock';
import type { ChronicleSegment } from '../dialogueFormat';

type ChronicleTabProps = {
  chronicleSegments: ChronicleSegment[];
  chronicleDateTimeFmt: Intl.DateTimeFormat;
};

/** Full-tab chronicle (same scroll chrome as other RPG tabs via parent `facsimile-scroll`). */
export function ChronicleTab({ chronicleSegments, chronicleDateTimeFmt }: ChronicleTabProps) {
  return (
    <section className="min-w-0 space-y-4 pb-4 font-serif">
      <p className="facsimile-kicker">Chronicle</p>
      <div className="space-y-4 pr-1">
        {chronicleSegments.map((segment, index) => {
          if (segment.type === 'world') {
            const row = segment.row;
            return (
              <div
                key={`world-${row.atMs}-${index}-${row.text.slice(0, 24)}`}
                className="border-b border-[var(--candle-rule)] pb-4 last:border-b-0"
              >
                <p className="font-serif text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                  {chronicleDateTimeFmt.format(row.atMs)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--candle-ink-soft)]">{row.text}</p>
              </div>
            );
          }
          const first = segment.lines[0];
          return (
            <div
              key={`dlg-${segment.role}-${first?.id ?? index}`}
              className="border-b border-[var(--candle-rule)] pb-4 last:border-b-0"
            >
              <p className="font-serif text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                {chronicleDateTimeFmt.format(first.atMs)}
              </p>
              <div className="mt-1">
                <DialogueVoiceBlock role={segment.role} lines={segment.lines} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
