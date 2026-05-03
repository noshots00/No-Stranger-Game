import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChatPanel } from '../chat/ChatPanel';
import { getGlobalGroupId } from '../chat/nip29Client';

type QueryStatus = 'pending' | 'error' | 'success';

type SocialTabProps = {
  socialStats: { totalPlayers: number; kindredSpirits: number; kindredPubkeys: string[] };
  activityRows: { pubkey: string; displayName: string; namedAt: number; detail: string }[];
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
    <section className="space-y-3 pb-4 font-serif">
      <div className="flex flex-col gap-1">
        {user ? (
          <div
            className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[0.5rem] leading-tight tracking-wide text-[var(--candle-ink-faint)]"
            aria-label="Social counts"
          >
            <p className="whitespace-nowrap">
              <span className="text-[var(--candle-ink-faint)]/90">Strangers</span>{' '}
              <span className="font-mono text-[0.5625rem] text-[var(--candle-ink)]">{socialStats.totalPlayers}</span>
            </p>
            <p className="whitespace-nowrap">
              <span className="text-[var(--candle-ink-faint)]/90">Kindred</span>{' '}
              <span className="font-mono text-[0.5625rem] text-[var(--candle-ink)]">{socialStats.kindredSpirits}</span>
            </p>
          </div>
        ) : null}

        <div className="min-h-[min(52vh,22rem)]">
          <ChatPanel
            groupId={getGlobalGroupId()}
            emptyHint="No one has spoken in the global lobby yet."
            characterNameLabel={characterNameLabel}
            speakerNameMap={lobbyNameMap}
            messageListClassName="min-h-[13rem] max-h-[min(48vh,26rem)]"
            hasCharacter={hasCharacter}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(['Guild', 'Market', 'Player Quests'] as const).map((label) => (
          <button
            key={label}
            type="button"
            disabled
            aria-disabled="true"
            title="Coming soon"
            className="social-channel-button min-h-0 cursor-not-allowed rounded-md px-1 py-1 text-center text-[0.5625rem] leading-tight text-[var(--candle-ink-faint)] opacity-50"
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 font-serif text-[0.625rem] uppercase tracking-[0.18em] text-[var(--candle-ink-faint)]">
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

      <div>
        <p className="mb-2 font-serif text-[0.625rem] uppercase tracking-[0.18em] text-[var(--candle-ink-faint)]">
          Activity
        </p>
        <div className="facsimile-scroll max-h-64 overflow-y-auto pr-0">
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
                  {row.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
