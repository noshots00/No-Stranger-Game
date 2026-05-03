import { NSchema as n } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export type OptionalKind0Metadata = {
  about: string | null;
  profileName: string | null;
};

/**
 * Fetches kind 0 metadata when `pubkey` is set; returns empty fields if missing (no throw).
 */
export function useOptionalKind0Metadata(pubkey: string | null, open: boolean) {
  const { nostr } = useNostr();

  return useQuery<OptionalKind0Metadata>({
    queryKey: ['nostr', 'kind0-optional', pubkey ?? ''],
    enabled: open && !!pubkey,
    queryFn: async () => {
      if (!pubkey) {
        return { about: null, profileName: null };
      }
      const [event] = await nostr.query(
        [{ kinds: [0], authors: [pubkey], limit: 1 }],
        { signal: AbortSignal.timeout(2000) }
      );
      if (!event?.content) {
        return { about: null, profileName: null };
      }
      try {
        const md = n.json().pipe(n.metadata()).parse(event.content);
        const about = typeof md.about === 'string' ? md.about.trim() : '';
        const profileName =
          (typeof md.display_name === 'string' && md.display_name.trim()) ||
          (typeof md.name === 'string' && md.name.trim()) ||
          null;
        return {
          about: about.length > 0 ? about : null,
          profileName,
        };
      } catch {
        return { about: null, profileName: null };
      }
    },
    staleTime: 5 * 60_000,
    retry: 0,
  });
}
