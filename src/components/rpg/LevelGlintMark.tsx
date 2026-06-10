import {
  levelGlintMarkClass,
  SHIPPED_LEVEL_VARIANT,
  type LevelHighlightVariant,
} from './characterHighlights';

type LevelGlintMarkProps = {
  level: number;
  variant?: LevelHighlightVariant;
};

function levelGlintLabel(level: number): string {
  return `Level ${level}!`;
}

/** Level-up label — static pale gold (no pulse / delay). */
export function LevelGlintMark({
  level,
  variant = SHIPPED_LEVEL_VARIANT,
}: LevelGlintMarkProps) {
  return (
    <span className={levelGlintMarkClass(variant, true)}>{levelGlintLabel(level)}</span>
  );
}

/** Dev preview — same static render as production. */
export function LevelGlintMarkPreview({
  level,
  variant = SHIPPED_LEVEL_VARIANT,
}: LevelGlintMarkProps) {
  return <LevelGlintMark level={level} variant={variant} />;
}
