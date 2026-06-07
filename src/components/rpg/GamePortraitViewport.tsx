import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Logical width aligned with common phones; keeps layout identical on mobile. */
export const GAME_PORTRAIT_MAX_WIDTH_PX = 430;

type GamePortraitViewportProps = {
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
};

function SideRail({ children, align }: { children: ReactNode; align: 'start' | 'end' }) {
  return (
    <aside
      className={cn(
        'hidden min-h-[100dvh] min-w-0 flex-col overflow-y-auto border-[var(--candle-rule)]/25 bg-[var(--candle-void)] px-3 py-4 lg:flex',
        align === 'end' ? 'items-end border-r' : 'items-start border-l'
      )}
    >
      <div
        className={cn(
          'sticky top-4 w-full max-w-[20rem]',
          align === 'end' ? 'mr-0 ml-auto' : 'ml-0 mr-auto'
        )}
      >
        {children}
      </div>
    </aside>
  );
}

/**
 * Centers the candlelit game in a portrait-width column on large screens so
 * responsive behavior matches mobile (narrow column, not wide desktop chrome).
 * Optional left/right rails use gutter space on wide viewports for dev tooling.
 */
export function GamePortraitViewport({ children, leftRail, rightRail }: GamePortraitViewportProps) {
  const hasRails = Boolean(leftRail || rightRail);

  if (!hasRails) {
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

  return (
    <div className="grid min-h-[100dvh] w-full grid-cols-1 bg-[var(--candle-void)] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      {leftRail ? <SideRail align="end">{leftRail}</SideRail> : <div className="hidden lg:block" aria-hidden />}

      <div
        className="relative mx-auto flex h-[100dvh] max-h-[100dvh] w-full min-w-0 flex-col overflow-hidden shadow-[0_28px_100px_rgba(0,0,0,0.55)]"
        style={{ maxWidth: GAME_PORTRAIT_MAX_WIDTH_PX }}
      >
        {children}
      </div>

      {rightRail ? <SideRail align="start">{rightRail}</SideRail> : <div className="hidden lg:block" aria-hidden />}
    </div>
  );
}
