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
    <section className="facsimile-panel space-y-4">
      <p className="facsimile-kicker">Social</p>
      {user ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Strangers</p>
            <p className="text-sm text-[var(--facsimile-ink)]">{socialStats.totalPlayers}</p>
          </div>
          <div className="rounded-md border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Kindred Spirits</p>
            <p className="text-sm text-[var(--facsimile-ink)]">{socialStats.kindredSpirits}</p>
          </div>
        </div>
      ) : null}
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Activity</p>
        <div className="overflow-hidden rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
          <div className="facsimile-scroll max-h-64 overflow-y-auto px-3 py-2">
            {activityStatus === 'pending' ? (
              <p className="text-xs text-[var(--facsimile-ink-muted)]">Loading…</p>
            ) : activityStatus === 'error' ? (
              <p className="text-xs text-rose-300">Could not load activity.</p>
            ) : activityRows.length === 0 ? (
              <p className="text-xs text-[var(--facsimile-ink-muted)]">
                No published character checkpoints with a remembered name yet.
              </p>
            ) : (
              <ul className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
                {activityRows.map((row) => (
                  <li key={row.pubkey} className="border-l border-[var(--facsimile-accent)]/50 pl-2">
                    <span className="text-[var(--facsimile-ink)]">{row.displayName}</span> remembered their name.
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--facsimile-ink-muted)]">Signals</p>
        {!user ? (
          <p className="text-xs text-[var(--facsimile-ink-muted)]">Log in to see signals from kindred spirits.</p>
        ) : kindredSignalStatus === 'pending' ? (
          <p className="text-xs text-[var(--facsimile-ink-muted)]">Loading…</p>
        ) : kindredSignalStatus === 'error' ? (
          <p className="text-xs text-rose-300">Could not load signals.</p>
        ) : (
          <ul className="space-y-2 text-xs text-[var(--facsimile-ink-muted)]">
            {kindredSignalRows.map((row) => (
              <li key={row.pubkey} className="border-l border-[var(--facsimile-panel-border)] pl-2">
                <span className="text-[var(--facsimile-ink)]">{row.name}</span>: {row.text}
              </li>
            ))}
            {kindredSignalRows.length === 0 ? (
              <li className="border-l border-[var(--facsimile-panel-border)] pl-2 text-[var(--facsimile-ink-muted)]">
                {socialStats.kindredPubkeys.length === 0
                  ? 'No kindred spirits yet—mutual follows with other players who started here.'
                  : 'No checkpoint data found for your kindred spirits on these relays yet.'}
              </li>
            ) : null}
          </ul>
        )}
      </div>
      <div className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)] p-2">
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          {['Guild', 'Market', 'Player Quests'].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              aria-disabled="true"
              title="Coming soon"
              className="social-channel-button cursor-not-allowed rounded-md border border-[var(--facsimile-panel-border)] bg-black/80 px-2 py-1 text-[11px] text-[var(--facsimile-ink-muted)] opacity-60"
            >
              {label}
            </button>
          ))}
        </div>
        {user ? (
          <>
            <div className="facsimile-scroll mb-2 h-36 overflow-y-auto rounded-md bg-black/35 p-2">
              {lobbyStatus === 'pending' ? (
                <p className="text-xs text-[var(--facsimile-ink-muted)]">Loading lobby…</p>
              ) : lobbyStatus === 'error' ? (
                <p className="text-xs text-rose-300">Could not load the lobby.</p>
              ) : (
                <ul className="space-y-1 text-xs text-[var(--facsimile-ink-muted)]">
                  {lobbyEvents.map((event) => (
                    <li key={event.id}>
                      <span className="text-[var(--facsimile-ink)]">
                        {event.pubkey === user?.pubkey ? characterNameLabel : (lobbyNameMap.get(event.pubkey) ?? event.pubkey.slice(0, 8))}
                      </span>{' '}
                      {truncatePlaintext(event.content, 280)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {lobbyError ? <p className="mb-1 text-[11px] text-rose-300">{lobbyError}</p> : null}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lobbyInput}
                onChange={(event) => setLobbyInput(event.target.value)}
                placeholder="Lobby message…"
                disabled={isLobbySendPending}
                className="w-full rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)] placeholder:text-[var(--facsimile-ink-muted)] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                disabled={isLobbySendPending}
                onClick={handleLobbySend}
                className="rounded-md border border-[var(--facsimile-panel-border)] bg-black px-2 py-1 text-xs text-[var(--facsimile-ink)] disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--facsimile-ink-muted)]">Log in to chat in the public lobby.</p>
        )}
      </div>
    </section>
  );
}
