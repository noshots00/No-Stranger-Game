import { useNostr } from '@nostrify/react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface EchoScrollPayload {
  targetPubkey: string;
  title: string;
  body: string;
}

export function useEchoChamber() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();

  return useMutation({
    mutationFn: async ({ targetPubkey, title, body }: EchoScrollPayload) => {
      if (!user?.signer?.nip04) {
        throw new Error('Signer does not support NIP-04 encryption');
      }
      const encrypted = await user.signer.nip04.encrypt(
        targetPubkey,
        JSON.stringify({
          title,
          body,
          createdAt: Math.floor(Date.now() / 1000),
          app: 'no-stranger-game',
        }),
      );
      const signed = await user.signer.signEvent({
        kind: 4,
        content: encrypted,
        tags: [
          ['p', targetPubkey],
          ['t', 'no-stranger-game'],
          ['scroll', 'echo-chamber'],
          ['alt', 'No Stranger Game encrypted echo scroll'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
      await nostr.event(signed);
      return signed.id;
    },
  });
}
