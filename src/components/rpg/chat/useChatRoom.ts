import { useCallback, useMemo } from 'react';

import { useNostr } from '@nostrify/react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NostrEvent } from '@nostrify/nostrify';

import { useCurrentUser } from '@/hooks/useCurrentUser';

import { queryGameRelays } from '@/lib/queryGameRelays';

import { publishGameRelayEvent } from '@/lib/publishGameRelayEvent';

import { GAME_CHAT_MESSAGE_KIND, NIP29_CHAT_KIND, buildChatMessageTemplate } from './nip29Client';



const CHAT_QUERY_LIMIT = 100;

/** Poll while Social / chat is open (primary + backup merge via pool `query`). */

export const CHAT_POLL_MS = 2_000;



type UseChatRoomOptions = {

  groupId: string;

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



function mergeChatEvents(primary: readonly NostrEvent[], legacy: readonly NostrEvent[]): NostrEvent[] {

  const byId = new Map<string, NostrEvent>();

  for (const event of [...primary, ...legacy]) {

    byId.set(event.id, event);

  }

  return [...byId.values()].sort((a, b) => a.created_at - b.created_at);

}



/**

 * Group chat on game relays (kind 1 + room `t` tag; reads legacy kind 9 + `h` too).

 */

export function useChatRoom({ groupId, enabled = true }: UseChatRoomOptions): ChatRoomState {

  const { nostr } = useNostr();

  const { user } = useCurrentUser();

  const queryClient = useQueryClient();



  const queryKey = useMemo(() => ['rpg-chat-room', groupId], [groupId]);



  const query = useQuery({

    queryKey,

    enabled: enabled && Boolean(groupId),

    staleTime: CHAT_POLL_MS,

    refetchInterval: enabled && Boolean(groupId) ? CHAT_POLL_MS : false,

    queryFn: async () => {

      const [modern, legacy] = await Promise.all([

        queryGameRelays(nostr, [{ kinds: [GAME_CHAT_MESSAGE_KIND], '#t': [groupId], limit: CHAT_QUERY_LIMIT }]),

        queryGameRelays(nostr, [{ kinds: [NIP29_CHAT_KIND], '#h': [groupId], limit: CHAT_QUERY_LIMIT }]),

      ]);

      return mergeChatEvents(modern, legacy);

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

      await publishGameRelayEvent(nostr, event);

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

