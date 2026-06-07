import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGameRelayHealth } from '@/hooks/useGameRelayHealth';
import { GamePortraitViewport } from '@/components/rpg/GamePortraitViewport';
import { GameRelayHealthControl } from '@/components/rpg/GameRelayHealthControl';
import { RPG_UI_CAPTION } from '@/components/rpg/typography/rpgUiTypography';
import { cn } from '@/lib/utils';

export function TitleScreen() {
  const { user } = useCurrentUser();
  const { refetch, data, isFetching } = useGameRelayHealth();
  const [relayHealthFlyoutOpen, setRelayHealthFlyoutOpen] = useState(false);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  if (user) {
    return <Navigate to="/game" replace />;
  }

  return (
    <GamePortraitViewport>
    <main className="candlelit-shell relative flex min-h-0 flex-1 flex-col overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 candle-flicker-ambient" aria-hidden />
      <div className="relative z-[2] mx-auto flex min-h-0 flex-1 w-full flex-col items-center justify-center gap-10 px-0 py-16">
        <div className="emerge flex w-full flex-col items-center gap-4 text-center">
          <h1 className="font-cormorant text-4xl font-semibold tracking-[0.04em] text-[var(--candle-ink)]">
            No Stranger Game
          </h1>
          <div className="flex flex-col items-center gap-1.5">
            <GameRelayHealthControl
              flyoutOpen={relayHealthFlyoutOpen}
              onFlyoutOpenChange={setRelayHealthFlyoutOpen}
              snapshot={data}
              isFetching={isFetching}
              onProbe={() => void refetch()}
            />
            <p className={cn(RPG_UI_CAPTION, 'text-[var(--candle-ink-faint)]')}>Game connection</p>
          </div>
        </div>
        <div className="game-login w-full max-w-sm">
          <LoginArea className="flex w-full justify-center" />
        </div>
      </div>
    </main>
    </GamePortraitViewport>
  );
}
