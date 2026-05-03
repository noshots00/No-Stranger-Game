import { Navigate } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { GamePortraitViewport } from '@/components/rpg/GamePortraitViewport';

export function TitleScreen() {
  const { user } = useCurrentUser();

  if (user) {
    return <Navigate to="/game" replace />;
  }

  return (
    <GamePortraitViewport>
    <main className="candlelit-shell relative flex min-h-0 flex-1 flex-col overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 candle-flicker-ambient" aria-hidden />
      <div className="relative z-[2] mx-auto flex min-h-0 flex-1 w-full flex-col items-center justify-center gap-10 px-0 py-16">
        <div className="emerge flex w-full flex-col items-center gap-8 text-center">
          <h1 className="font-cormorant text-4xl font-semibold tracking-[0.04em] text-[var(--candle-ink)]">
            No Stranger Game
          </h1>
          <div className="breathing-flame" aria-hidden />
          <p className="max-w-xs font-serif text-lg italic leading-relaxed text-[var(--candle-ink-faint)]">
            By a single flame, the room remembers.
          </p>
        </div>
        <div className="game-login w-full max-w-sm">
          <LoginArea className="flex w-full justify-center" />
        </div>
      </div>
    </main>
    </GamePortraitViewport>
  );
}
