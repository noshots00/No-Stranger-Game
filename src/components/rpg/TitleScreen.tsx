import { Navigate } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function TitleScreen() {
  const { user } = useCurrentUser();

  if (user) {
    return <Navigate to="/game" replace />;
  }

  return (
    <main className="candlelit-shell relative min-h-[100dvh] w-full overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 candle-flicker-ambient" aria-hidden />
      <div className="relative z-[2] mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-10 px-8 py-16">
        <div className="emerge flex w-full flex-col items-center gap-8 text-center">
          <h1 className="font-cormorant text-4xl font-semibold tracking-[0.04em] text-[var(--candle-ink)] sm:text-5xl">
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
  );
}
