import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';

export function useForgetting() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.signer) throw new Error('User not available');
      const deletionEvent = await user.signer.signEvent({
        kind: 5,
        content: '',
        tags: [
          ['e', eventId],
          ['t', 'no-stranger-game'],
          ['alt', 'No Stranger Game forgetting ritual'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });
      await nostr.event(deletionEvent);
      return deletionEvent.id;
    },
  });
}
