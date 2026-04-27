import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { CHAPTER_PROOF_KIND } from '@/lib/rpg/proof';

export interface ProofChainNode {
  id: string;
  createdAt: number;
  chapter: string;
  window: string;
  choice: string;
  prev: string;
}

export function useProofChain(userPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<ProofChainNode[]>({
    queryKey: ['nostr', 'proof-chain', userPubkey ?? ''],
    enabled: Boolean(userPubkey),
    staleTime: 45_000,
    queryFn: async () => {
      if (!userPubkey) return [];
      const events = await nostr.query(
        [{ kinds: [CHAPTER_PROOF_KIND], authors: [userPubkey], limit: 100 }],
        { signal: AbortSignal.timeout(6000) },
      );

      return events
        .map((event) => ({
          id: event.id,
          createdAt: event.created_at,
          chapter: event.tags.find(([name]) => name === 'chapter')?.[1] ?? 'unknown',
          window: event.tags.find(([name]) => name === 'window')?.[1] ?? 'unknown',
          choice: event.tags.find(([name]) => name === 'choice')?.[1] ?? '?',
          prev: event.tags.find(([name]) => name === 'prev')?.[1] ?? 'genesis',
        }))
        .sort((a, b) => a.createdAt - b.createdAt);
    },
  });
}
