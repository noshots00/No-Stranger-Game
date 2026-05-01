import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { NSG_SOCIAL_LOBBY_T, truncatePlaintext } from '../social/socialTags';

type QueryStatus = 'pending' | 'error' | 'success';

type SocialTabProps = {
  socialStats: { totalPlayers: number; kindredSpirits: number; kindredPubkeys: string[] };
  activityRows: { pubkey: string; displayName: string; namedAt: number }[];
  activityStatus: QueryStatus;
  kindredSignalRows: { pubkey: string; name: string; text: string; latestAt: number }[];
  kindredSignalStatus: QueryStatus;
  lobbyEvents: NostrEvent[];
  lobbyStatus: QueryStatus;
  lobbyNameMap: Map<string, string>;
  characterNameLabel: string;
};

export function SocialTab({
  socialStats,
  activityRows,
  activityStatus,
  kindredSignalRows,
  kindredSignalStatus,
  lobbyEvents,
  lobbyStatus,
  lobbyNameMap,
  characterNameLabel,
}: SocialTabProps) {
  const { user } = useCurrentUser();
  const { mutate: publishNostrEvent, isPending: isLobbySendPending } = useNostrPublish();
  const queryClient = useQueryClient();
  const [lobbyInput, setLobbyInput] = useState('');
  const [lobbyError, setLobbyError] = useState<string | null>(null);

  const handleLobbySend = () => {
    if (!user) return;
    const trimmed = lobbyInput.trim();
    if (!trimmed) {
      setLobbyError('Message cannot be empty.');
      return;
    }
    if (trimmed.length > 4000) {
      setLobbyError('Message is too long.');
      return;
    }
    setLobbyError(null);
    publishNostrEvent(
      { kind: 1, content: trimmed, tags: [['t', NSG_SOCIAL_LOBBY_T]] },
      {
        onSuccess: () => {
          setLobbyInput('');
          void queryClient.invalidateQueries({ queryKey: ['rpg-social-lobby', NSG_SOCIAL_LOBBY_T] });
        },
        onError: (error: unknown) => {
          setLobbyError(error instanceof Error ? error.message : 'Failed to send.');
        },
      }
    );
  };

  return (
    <section className="space-y-8 pb-4 font-serif">
      <p className="facsimile-kicker">Social</p>
      {user ? (
        <div className="flex flex-wrap items-baseline justify-between gap-6 text-sm text-[var(--candle-ink-soft)]">
          <p>
            <span className="text-[var(--candle-ink-faint)]">Strangers</span>{' '}
            <span className="font-mono text-lg text-[var(--candle-ink)]">{socialStats.totalPlayers}</span>
          </p>
          <p>
            <span className="text-[var(--candle-ink-faint)]">Kindred</span>{' '}
            <span className="font-mono text-lg text-[var(--candle-ink)]">{socialStats.kindredSpirits}</span>
          </p>
        </div>
      ) : null}
      <hr className="candle-rule" />
      <div>
        <p className="mb-2 font-serif text-[10px] uppercase tracking-[0.18em] text-[var(--candle-ink-faint)]">
          Activity
        </p>
        <div className="facsimile-scroll max-h-64 overflow-y-auto pr-1">
          {activityStatus === 'pending' ? (
            <p className="text-sm text-[var(--candle-ink-faint)]">Loading…</p>
          ) : activityStatus === 'error' ? (
            <p className="text-sm text-rose-300/90">Could not load activity.</p>
          ) : activityRows.length === 0 ? (
            <p className="text-sm leading-relaxed text-[var(--candle-ink-soft)]">
              No published character checkpoints with a remembered name yet.
            </p>
          ) : (
            <ul className="space-y-3 text-sm text-[var(--candle-ink-soft)]">
              {activityRows.map((row) => (
                <li key={row.pubkey} className="border-l border-[var(--candle-flame-soft)]/40 pl-3">
                  <span className="text-[var(--candle-ink)]">{row.displayName}</span> remembered their name.
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <hr className="candle-rule" />
      <div>
        <p className="mb-2 font-serif text-[10px] uppercase tracking-[0.18em] text-[var(--candle-ink-faint)]">
          Signals
        </p>
        {!user ? (
          <p className="text-sm text-[var(--candle-ink-soft)]">Log in to see signals from kindred spirits.</p>
        ) : kindredSignalStatus === 'pending' ? (
          <p className="text-sm text-[var(--candle-ink-faint)]">Loading…</p>
        ) : kindredSignalStatus === 'error' ? (
          <p className="text-sm text-rose-300/90">Could not load signals.</p>
        ) : (
          <ul className="space-y-3 text-sm text-[var(--candle-ink-soft)]">
            {kindredSignalRows.map((row) => (
              <li key={row.pubkey} className="border-l border-[var(--candle-rule)] pl-3">
                <span className="text-[var(--candle-ink)]">{row.name}</span>: {row.text}
              </li>
            ))}
            {kindredSignalRows.length === 0 ? (
              <li className="border-l border-[var(--candle-rule)] pl-3 text-[var(--candle-ink-faint)]">
                {socialStats.kindredPubkeys.length === 0
                  ? 'No kindred spirits yet—mutual follows with other players who started here.'
                  : 'No checkpoint data found for your kindred spirits on these relays yet.'}
              </li>
            ) : null}
          </ul>
        )}
      </div>
      <hr className="candle-rule" />
      <div className="space-y-4">
        <div className="mb-2 grid grid-cols-3 gap-2">
          {['Guild', 'Market', 'Player Quests'].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              aria-disabled="true"
              title="Coming soon"
              className="social-channel-button min-h-[44px] cursor-not-allowed rounded-md px-2 py-2 text-center text-[11px] text-[var(--candle-ink-faint)] opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
        {user ? (
          <>
            <div className="facsimile-scroll mb-3 max-h-40 overflow-y-auto pr-1">
              {lobbyStatus === 'pending' ? (
                <p className="text-sm text-[var(--candle-ink-faint)]">Loading lobby…</p>
              ) : lobbyStatus === 'error' ? (
                <p className="text-sm text-rose-300/90">Could not load the lobby.</p>
              ) : (
                <ul className="space-y-2 text-sm text-[var(--candle-ink-soft)]">
                  {lobbyEvents.map((event) => (
                    <li key={event.id}>
                      <span className="text-[var(--candle-ink)]">
                        {event.pubkey === user?.pubkey ? characterNameLabel : (lobbyNameMap.get(event.pubkey) ?? event.pubkey.slice(0, 8))}
                      </span>{' '}
                      {truncatePlaintext(event.content, 280)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {lobbyError ? <p className="mb-1 text-xs text-rose-300/90">{lobbyError}</p> : null}
            <div className="flex min-h-[48px] items-end gap-3 border-b border-[var(--candle-rule)] pb-1 focus-within:border-[var(--candle-flame-soft)]">
              <input
                type="text"
                value={lobbyInput}
                onChange={(event) => setLobbyInput(event.target.value)}
                placeholder="Lobby message…"
                disabled={isLobbySendPending}
                className="min-h-[44px] flex-1 border-0 bg-transparent px-0 py-2 font-serif text-sm text-[var(--candle-ink)] placeholder:text-[var(--candle-ink-faint)] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                disabled={isLobbySendPending}
                onClick={handleLobbySend}
                className="mb-1 min-h-[44px] shrink-0 px-2 font-serif text-sm text-[var(--candle-wax)] underline decoration-[var(--candle-rule)] underline-offset-4 transition-colors hover:decoration-[var(--candle-flame-soft)] disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--candle-ink-soft)]">Log in to chat in the public lobby.</p>
        )}
      </div>
    </section>
  );
}
