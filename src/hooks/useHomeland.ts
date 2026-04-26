import { useMemo } from 'react';

export interface HomelandData {
  homelandDomain: string | null;
  homelandLabel: string;
  homelandFlavorLine?: string;
}

export function useHomeland(nip05: string | undefined): HomelandData {
  return useMemo(() => {
    const normalized = nip05?.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      return { homelandDomain: null, homelandLabel: 'Unknown Roads' };
    }

    const domain = normalized.split('@')[1]?.trim();
    if (!domain || !domain.includes('.')) {
      return { homelandDomain: null, homelandLabel: 'Unknown Roads' };
    }

    return {
      homelandDomain: domain,
      homelandLabel: domain,
      homelandFlavorLine: `A merchant recognizes the mark of ${domain}.`,
    };
  }, [nip05]);
}
