import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { CHAPTER_PROOF_KIND } from '@/lib/rpg/proof';

export interface LedgerChoiceTally {
  option: string;
  count: number;
}

export interface StrangersLedgerData {
  totalStrangers: number;
  tally: LedgerChoiceTally[];
}

export function useStrangersLedger() {
  const { nostr } = useNostr();

  return useQuery<StrangersLedgerData>({
    queryKey: ['nostr', 'strangers-ledger'],
    staleTime: 60_000,
    queryFn: async () => {
      const events = await nostr.query(
        [{ kinds: [CHAPTER_PROOF_KIND], '#chapter': ['market-money-001'], limit: 500 }],
        { signal: AbortSignal.timeout(7000) },
      );

      const byPubkey = new Map<string, string>();
      for (const event of events) {
        const choice = event.tags.find(([name]) => name === 'choice')?.[1] ?? 'unknown';
        if (!byPubkey.has(event.pubkey)) {
          byPubkey.set(event.pubkey, choice);
        }
      }

      const counts = new Map<string, number>();
      for (const choice of byPubkey.values()) {
        counts.set(choice, (counts.get(choice) ?? 0) + 1);
      }

      return {
        totalStrangers: byPubkey.size,
        tally: [...counts.entries()].map(([option, count]) => ({ option, count })).sort((a, b) => b.count - a.count),
      };
    },
  });
}
