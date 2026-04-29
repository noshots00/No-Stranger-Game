import { useCallback, useEffect, useRef, useState } from 'react';

import type { DeepPartial, GameState } from '@/types/game';
import { nostrPersistence } from '@/services/nostrPersistence';

export function useNostrPersistence(pubkey: string | undefined) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef<GameState | null>(null);

  useEffect(() => {
    if (!pubkey) {
      const local = nostrPersistence.loadLocal();
      setState(local);
      stateRef.current = local;
      setLoading(false);
      return;
    }

    let mounted = true;
    void nostrPersistence.load(pubkey).then((loaded) => {
      if (!mounted) return;
      setState(loaded);
      stateRef.current = loaded;
      setLoading(false);
    });

    const unsub = nostrPersistence.subscribe((updated) => {
      setState(updated);
      stateRef.current = updated;
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [pubkey]);

  const save = useCallback(
    (patch: DeepPartial<GameState>) => {
      if (pubkey) {
        nostrPersistence.queueSave(pubkey, patch);
        return;
      }
      const next = nostrPersistence.update(patch);
      stateRef.current = next;
      setState(next);
    },
    [pubkey],
  );

  const forceSave = useCallback(
    async (patch?: DeepPartial<GameState>) => {
      if (!pubkey) {
        if (patch) {
          const next = nostrPersistence.update(patch);
          stateRef.current = next;
          setState(next);
        }
        return true;
      }
      return nostrPersistence.forceSync(pubkey, patch);
    },
    [pubkey],
  );

  return { state, loading, save, forceSave };
}
