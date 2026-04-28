import { useMemo } from 'react';
import type { MVPCharacter } from '@/lib/rpg/utils';
import { getAvailableSideQuests } from '@/lib/rpg/sideQuests';

export function useSideQuests(character: MVPCharacter | null) {
  const sideQuests = useMemo(() => {
    if (!character) return [];
    return getAvailableSideQuests(character).slice(0, 2);
  }, [character]);

  return { sideQuests };
}
