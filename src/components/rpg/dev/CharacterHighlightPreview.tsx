import { useState, type ReactNode } from 'react';
import { LevelGlintMarkPreview } from '../LevelGlintMark';
import { RPG_UI_LOG_LINE } from '../typography/rpgUiTypography';

const SAMPLE_NAME = 'Aldric Thornwood';
const PREVIEW_LINE_ID = 'dev-preview-level';

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-1.5">
      <span className="w-3 shrink-0 font-mono text-[0.58rem] font-semibold text-[var(--candle-flame-soft)]">
        {label}
      </span>
      <p className={`min-w-0 flex-1 text-[0.8rem] leading-snug ${RPG_UI_LOG_LINE}`}>{children}</p>
    </div>
  );
}

type CharacterHighlightPreviewProps = {
  compact?: boolean;
};

/** Dev rail: player-name shipped style + level-up one-shot variants. */
export function CharacterHighlightPreview({ compact = false }: CharacterHighlightPreviewProps) {
  const [replayKey, setReplayKey] = useState(0);
  const [showAllLevels, setShowAllLevels] = useState(!compact);

  return (
    <div className={`${compact ? 'space-y-1.5' : 'space-y-3'}`}>
      <PreviewRow label="·">
        Your name is <span className="player-name-mark">{SAMPLE_NAME}</span>.
      </PreviewRow>
      <div>
        <div className="mb-1 flex items-center justify-between gap-1">
          {compact ? (
            <button
              type="button"
              className="font-serif text-[0.55rem] text-[var(--candle-ink-faint)] underline-offset-2 hover:text-[var(--candle-ink-soft)] hover:underline"
              onClick={() => setShowAllLevels((v) => !v)}
            >
              {showAllLevels ? 'Level · shipped only' : 'Level · compare 1–3'}
            </button>
          ) : (
            <p className="font-serif text-[0.65rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">
              Level ups
            </p>
          )}
          <button
            type="button"
            className="rpg-mini-btn shrink-0 px-1 py-0.5 font-serif text-[0.5rem] uppercase tracking-[0.08em]"
            onClick={() => setReplayKey((k) => k + 1)}
          >
            Replay
          </button>
        </div>
        <div key={replayKey} className="space-y-1">
          {showAllLevels ? (
            <>
              <PreviewRow label="1">
                You reached{' '}
                <LevelGlintMarkPreview
                  level={1}
                  lineId={`${PREVIEW_LINE_ID}-1-${replayKey}`}
                  forceFresh
                  variant="1"
                />
                !
              </PreviewRow>
              <PreviewRow label="2">
                You reached{' '}
                <LevelGlintMarkPreview
                  level={1}
                  lineId={`${PREVIEW_LINE_ID}-2-${replayKey}`}
                  forceFresh
                  variant="2"
                />
                !
              </PreviewRow>
            </>
          ) : null}
          <PreviewRow label={showAllLevels ? '3' : '·'}>
            You reached{' '}
            <LevelGlintMarkPreview
              level={1}
              lineId={`${PREVIEW_LINE_ID}-3-${replayKey}`}
              forceFresh
              variant="3"
            />
            !
          </PreviewRow>
        </div>
      </div>
      {!compact ? (
        <p className="font-serif text-[0.6rem] leading-snug text-[var(--candle-ink-faint)]">
          Shipped: level style 3 (ember sparks).
        </p>
      ) : null}
    </div>
  );
}
