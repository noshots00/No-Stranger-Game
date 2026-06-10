import { type ReactNode } from 'react';
import {
  LEVEL_HIGHLIGHT_VARIANTS,
  LEVEL_VARIANT_META,
  PLAYER_NAME_HIGHLIGHT_VARIANTS,
  PLAYER_NAME_VARIANT_META,
  SHIPPED_LEVEL_VARIANT,
  SHIPPED_PLAYER_NAME_VARIANT,
  playerNameMarkClass,
  type LevelHighlightVariant,
  type PlayerNameHighlightVariant,
} from '../characterHighlights';
import { LevelGlintMarkPreview } from '../LevelGlintMark';
import { PlayerNameInText } from '../PlayerNameInText';
import { RPG_UI_LOG_LINE } from '../typography/rpgUiTypography';

const SAMPLE_NAME = 'Aldric Thornwood';

type CharacterHighlightPreviewProps = {
  compact?: boolean;
};

function PreviewRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex gap-1.5">
        <span className="w-3 shrink-0 font-mono text-[0.58rem] font-semibold text-[var(--candle-flame-soft)]">
          {label}
        </span>
        <p className={`min-w-0 flex-1 text-[0.8rem] leading-snug ${RPG_UI_LOG_LINE}`}>{children}</p>
      </div>
      {hint ? (
        <p className="pl-[1.125rem] font-serif text-[0.55rem] leading-snug text-[var(--candle-ink-faint)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Dev rail: compare three name + three level highlight styles (candlelit palette). */
export function CharacterHighlightPreview({ compact = false }: CharacterHighlightPreviewProps) {
  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'}`}>
      <div className="space-y-1.5">
        <p className="font-serif text-[0.6rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">
          Player names
        </p>
        {PLAYER_NAME_HIGHLIGHT_VARIANTS.map((variant: PlayerNameHighlightVariant) => {
          const meta = PLAYER_NAME_VARIANT_META[variant];
          const shipped = variant === SHIPPED_PLAYER_NAME_VARIANT;
          return (
            <PreviewRow
              key={variant}
              label={variant}
              hint={`${meta.title}${shipped ? ' · shipped' : ''} — ${meta.blurb}`}
            >
              Your name is <span className={playerNameMarkClass(variant)}>{SAMPLE_NAME}</span>.
            </PreviewRow>
          );
        })}
        {PLAYER_NAME_HIGHLIGHT_VARIANTS.map((variant: PlayerNameHighlightVariant) => (
          <PreviewRow key={`prose-${variant}`} label="·" hint={`In prose (${PLAYER_NAME_VARIANT_META[variant].title})`}>
            <PlayerNameInText
              text={`${SAMPLE_NAME} steps into the tavern light.`}
              playerName={SAMPLE_NAME}
              nameVariant={variant}
            />
          </PreviewRow>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="font-serif text-[0.6rem] uppercase tracking-[0.12em] text-[var(--candle-ink-soft)]">
          Level ups
        </p>
        {LEVEL_HIGHLIGHT_VARIANTS.map((variant: LevelHighlightVariant) => {
          const meta = LEVEL_VARIANT_META[variant];
          const shipped = variant === SHIPPED_LEVEL_VARIANT;
          return (
            <PreviewRow
              key={variant}
              label={variant}
              hint={`${meta.title}${shipped ? ' · shipped' : ''} — ${meta.blurb}`}
            >
              You reached <LevelGlintMarkPreview level={5} variant={variant} />
            </PreviewRow>
          );
        })}
      </div>

      {!compact ? (
        <p className="font-serif text-[0.6rem] leading-snug text-[var(--candle-ink-faint)]">
          Shipped: name {SHIPPED_PLAYER_NAME_VARIANT} · level {SHIPPED_LEVEL_VARIANT} (static, no animation).
        </p>
      ) : null}
    </div>
  );
}
