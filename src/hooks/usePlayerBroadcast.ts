import { useCallback } from 'react';

import { playerBroadcast, type TemplateKey } from '@/services/playerBroadcast';

export function usePlayerBroadcast() {
  const broadcast = useCallback((template: TemplateKey, vars?: Record<string, string>) => {
    playerBroadcast.enqueue(template, vars);
  }, []);

  return { broadcast };
}
