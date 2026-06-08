import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Logical width aligned with common phones; keeps layout identical on mobile. */
export const GAME_PORTRAIT_MAX_WIDTH_PX = 430;

type GamePortraitViewportProps = {
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
};

const portraitShellStyle = {
  '--game-portrait-width': `${GAME_PORTRAIT_MAX_WIDTH_PX}px`,
} as CSSProperties;

function GamePortraitShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[var(--game-portrait-width)] shrink-0 flex-col overflow-hidden border-0"
      style={portraitShellStyle}
    >
      {children}
    </div>
  );
}

function FixedSideRail({
  children,
  side,
}: {
  children: ReactNode;
  side: 'left' | 'right';
}) {
  return (
    <aside
      className={cn(
        'candlelit-chrome fixed top-0 z-10 hidden h-[100dvh] overflow-y-auto candlelit-scroll border-[var(--candle-rule)]/25 bg-[var(--candle-void)] px-3 py-4 lg:block',
        'w-[max(0px,calc((100vw-var(--game-portrait-width))/2))]',
        side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
      )}
      style={portraitShellStyle}
    >
      <div
        className={cn(
          'sticky top-4 w-full max-w-[20rem]',
          side === 'left' ? 'ml-auto' : 'mr-auto'
        )}
      >
        {children}
      </div>
    </aside>
  );
}

/**
 * Centers the candlelit game in a fixed portrait-width column on large screens so
 * responsive behavior matches mobile. Dev rails sit in viewport gutters and never
 * shrink the game shell when location or panel content changes.
 */
export function GamePortraitViewport({ children, leftRail, rightRail }: GamePortraitViewportProps) {
  return (
    <div
      className="candlelit-chrome relative flex min-h-[100dvh] w-full justify-center bg-[var(--candle-void)]"
      style={portraitShellStyle}
    >
      {leftRail ? <FixedSideRail side="left">{leftRail}</FixedSideRail> : null}
      <GamePortraitShell>{children}</GamePortraitShell>
      {rightRail ? <FixedSideRail side="right">{rightRail}</FixedSideRail> : null}
    </div>
  );
}
