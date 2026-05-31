import type { ReactNode } from 'react';

/** Logical width aligned with common phones; keeps layout identical on desktop. */
export const GAME_PORTRAIT_MAX_WIDTH_PX = 430;

type GamePortraitViewportProps = {
  children: ReactNode;
};

/**
 * Centers the candlelit game in a portrait-width column on large screens so
 * responsive behavior matches mobile (narrow column, not wide desktop chrome).
 */
export function GamePortraitViewport({ children }: GamePortraitViewportProps) {
  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-[var(--candle-void)]">
      <div
        className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden shadow-[0_28px_100px_rgba(0,0,0,0.55)]"
        style={{ maxWidth: GAME_PORTRAIT_MAX_WIDTH_PX }}
      >
        {children}
      </div>
    </div>
  );
}
