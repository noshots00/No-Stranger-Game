import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  DEFAULT_CHAT_RELAY,
  NIP29_CHAT_KIND,
  buildChatMessageTemplate,
} from './nip29Client';

const CHAT_QUERY_LIMIT = 100;
const CHAT_STALE_MS = 30_000;

type UseChatRoomOptions = {
  groupId: string;
  /** Override the default group-chat relay. */
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
 * Subscribes to a single NIP-29 group room on a single relay and exposes a
 * send mutation that publishes ONLY to that relay (so chat does NOT leak to
 * the user's regular nostr profile feed).
 */
export function useChatRoom({ groupId, relayUrl, enabled = true }: UseChatRoomOptions): ChatRoomState {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const url = relayUrl ?? DEFAULT_CHAT_RELAY;
  const relay = useMemo(() => nostr.relay(url), [nostr, url]);

  const queryKey = useMemo(() => ['rpg-chat-room', url, groupId], [url, groupId]);

  const query = useQuery({
    queryKey,
    enabled: enabled && Boolean(groupId),
    staleTime: CHAT_STALE_MS,
    queryFn: async () => {
      const rows = await relay.query([
        { kinds: [NIP29_CHAT_KIND], '#h': [groupId], limit: CHAT_QUERY_LIMIT },
      ]);
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
      await relay.event(event, { signal: AbortSignal.timeout(5000) });
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
