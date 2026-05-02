import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useChatRoom } from './useChatRoom';

type ChatPanelProps = {
  /** Stable group identifier (NIP-29 `h` tag). */
  groupId: string;
  /** Heading shown above the messages list. */
  title: string;
  /** Empty-state hint when no one else has spoken in this room. */
  emptyHint?: string;
  /** Player's display name; used to label own messages. */
  characterNameLabel: string;
  /** Map pubkey -> rendered name for OTHER speakers. */
  speakerNameMap?: Map<string, string>;
  /** Tailwind height classes for the scrolling message list. */
  messageListClassName?: string;
  /** Has the player created a character? When false, gates the room behind a hint. */
  hasCharacter: boolean;
};

const truncate = (text: string, max: number): string => {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
};

export function ChatPanel({
  groupId,
  title,
  emptyHint = 'No one else has spoken here yet.',
  characterNameLabel,
  speakerNameMap,
  messageListClassName = 'max-h-40',
  hasCharacter,
}: ChatPanelProps) {
  const { user } = useCurrentUser();
  const { events, status, send, isSending } = useChatRoom({ groupId, enabled: hasCharacter });
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="space-y-2">
        <p className="font-serif text-[10px] uppercase tracking-[0.18em] text-[var(--candle-ink-faint)]">{title}</p>
        <p className="text-sm text-[var(--candle-ink-soft)]">Log in to join the conversation.</p>
      </div>
    );
  }

  if (!hasCharacter) {
    return (
      <div className="space-y-2">
        <p className="font-serif text-[10px] uppercase tracking-[0.18em] text-[var(--candle-ink-faint)]">{title}</p>
        <p className="text-sm text-[var(--candle-ink-soft)]">
          Name your character first to join this room.
        </p>
      </div>
    );
  }

  const handleSend = async () => {
    setError(null);
    try {
      await send(draft);
      setDraft('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send.');
    }
  };

  return (
    <div className="space-y-2">
      <p className="font-serif text-[10px] uppercase tracking-[0.18em] text-[var(--candle-ink-faint)]">{title}</p>
      <div className={`facsimile-scroll overflow-y-auto pr-1 ${messageListClassName}`}>
        {status === 'pending' ? (
          <p className="text-sm text-[var(--candle-ink-faint)]">Loading messages…</p>
        ) : status === 'error' ? (
          <p className="text-sm text-rose-300/90">Could not load this room.</p>
        ) : events.length === 0 ? (
          <p className="text-sm italic text-[var(--candle-ink-soft)]">{emptyHint}</p>
        ) : (
          <ul className="space-y-2 text-sm text-[var(--candle-ink-soft)]">
            {events.map((event) => {
              const isMine = event.pubkey === user.pubkey;
              const speaker = isMine
                ? characterNameLabel
                : (speakerNameMap?.get(event.pubkey) ?? event.pubkey.slice(0, 8));
              return (
                <li key={event.id}>
                  <span className="text-[var(--candle-ink)]">{speaker}</span>{' '}
                  {truncate(event.content, 280)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error ? <p className="text-xs text-rose-300/90">{error}</p> : null}
      <div className="flex min-h-[44px] items-end gap-3 border-b border-[var(--candle-rule)] pb-1 focus-within:border-[var(--candle-flame-soft)]">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!isSending) void handleSend();
            }
          }}
          placeholder="Say something…"
          disabled={isSending}
          className="min-h-[40px] flex-1 border-0 bg-transparent px-0 py-2 font-serif text-sm text-[var(--candle-ink)] placeholder:text-[var(--candle-ink-faint)] focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          disabled={isSending}
          onClick={() => void handleSend()}
          className="mb-1 min-h-[40px] shrink-0 px-2 font-serif text-sm text-[var(--candle-wax)] underline decoration-[var(--candle-rule)] underline-offset-4 transition-colors hover:decoration-[var(--candle-flame-soft)] disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}
