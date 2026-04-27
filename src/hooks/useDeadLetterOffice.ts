import { useNostr } from '@nostrify/react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface DeadLetterPayload {
  title: string;
  body: string;
  unlockAt?: number;
}

export function useDeadLetterOffice() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();

  return useMutation({
    mutationFn: async (payload: DeadLetterPayload) => {
      if (!user?.signer?.nip04) {
        throw new Error('Signer does not support NIP-04 encryption');
      }
      const encrypted = await user.signer.nip04.encrypt(
        user.pubkey,
        JSON.stringify({
          ...payload,
          createdAt: Math.floor(Date.now() / 1000),
        }),
      );
      const signed = await user.signer.signEvent({
        kind: 4,
        content: encrypted,
        tags: [
          ['p', user.pubkey],
          ['t', 'no-stranger-game'],
          ['letter', 'dead-letter'],
          ['alt', 'No Stranger Game sealed dead letter'],
          ...(payload.unlockAt ? [['unlock_at', String(payload.unlockAt)]] : []),
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
      await nostr.event(signed);
      return signed.id;
    },
  });
}
