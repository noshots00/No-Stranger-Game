import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { GAME_RELAY_URLS } from '@/lib/gameRelays';
import { NIP29_CHAT_KIND, buildChatMessageTemplate } from './nip29Client';

const CHAT_QUERY_LIMIT = 100;
/** Poll while Social / chat is open (primary + backup merge via pool `query`). */
export const CHAT_POLL_MS = 2_000;

type UseChatRoomOptions = {
  groupId: string;
  /** Override the default group-chat relay (single-relay mode; prefer unset for game relays). */
  relayUrl?: string;
  /** Disable network access entirely (e.g. when player has no character). */
  enabled?: boolean;
};

export type ChatRoomState = {
  events: NostrEvent[];
  status: 'pending' | 'error' | 'success';
  error: unknown;
  send: (content: string) => Promise<void>;
  isSending: boolean;
  refresh: () => Promise<void>;
};

/**
 * NIP-29 group room on game relays (primary + backup reads, writes to all game write relays).
 */
export function useChatRoom({ groupId, relayUrl, enabled = true }: UseChatRoomOptions): ChatRoomState {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const relayUrls = useMemo(() => (relayUrl ? [relayUrl] : [...GAME_RELAY_URLS]), [relayUrl]);
  const singleRelay = useMemo(
    () => (relayUrl ? nostr.relay(relayUrl) : null),
    [nostr, relayUrl]
  );

  const queryKey = useMemo(() => ['rpg-chat-room', relayUrls.join(','), groupId], [relayUrls, groupId]);

  const query = useQuery({
    queryKey,
    enabled: enabled && Boolean(groupId),
    staleTime: CHAT_POLL_MS,
    refetchInterval: enabled && Boolean(groupId) ? CHAT_POLL_MS : false,
    queryFn: async () => {
      const filters = [{ kinds: [NIP29_CHAT_KIND], '#h': [groupId], limit: CHAT_QUERY_LIMIT }];
      const rows = singleRelay
        ? await singleRelay.query(filters)
        : await nostr.query(filters);
      return rows.sort((a, b) => a.created_at - b.created_at);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not logged in.');
      const trimmed = content.trim();
      if (!trimmed) throw new Error('Message cannot be empty.');
      if (trimmed.length > 4000) throw new Error('Message is too long.');

      const template = buildChatMessageTemplate(groupId, trimmed);
      const event = await user.signer.signEvent(template);
      if (singleRelay) {
        await singleRelay.event(event, { signal: AbortSignal.timeout(5000) });
      } else {
        await nostr.event(event, { signal: AbortSignal.timeout(5000) });
      }
      return event;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const send = useCallback(
    async (content: string) => {
      await sendMutation.mutateAsync(content);
    },
    [sendMutation]
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    events: query.data ?? [],
    status: query.isPending ? 'pending' : query.isError ? 'error' : 'success',
    error: query.error,
    send,
    isSending: sendMutation.isPending,
    refresh,
  };
}
