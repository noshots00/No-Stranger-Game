import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChatPanel } from '../chat/ChatPanel';
import { getGlobalGroupId } from '../chat/nip29Client';

type QueryStatus = 'pending' | 'error' | 'success';

type SocialTabProps = {
  socialStats: { totalPlayers: number; kindredSpirits: number; kindredPubkeys: string[] };
  activityRows: { pubkey: string; displayName: string; namedAt: number }[];
  activityStatus: QueryStatus;
  kindredSignalRows: { pubkey: string; name: string; text: string; latestAt: number }[];
  kindredSignalStatus: QueryStatus;
  lobbyNameMap: Map<string, string>;
  characterNameLabel: string;
  /** True when the player has set their character name (chat membership gate). */
  hasCharacter: boolean;
};

export function SocialTab({
  socialStats,
  activityRows,
  activityStatus,
  kindredSignalRows,
  kindredSignalStatus,
  lobbyNameMap,
  characterNameLabel,
  hasCharacter,
}: SocialTabProps) {
  const { user } = useCurrentUser();

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
        <ChatPanel
          groupId={getGlobalGroupId()}
          title="Global lobby"
          emptyHint="No one has spoken in the global lobby yet."
          characterNameLabel={characterNameLabel}
          speakerNameMap={lobbyNameMap}
          messageListClassName="max-h-40"
          hasCharacter={hasCharacter}
        />
      </div>
    </section>
  );
}
