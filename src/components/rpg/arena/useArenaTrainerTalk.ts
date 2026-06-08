import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCombatEncounter } from '@/components/rpg/combat/useCombatEncounter';
import type { QuestState } from '@/components/rpg/quests/types';
import type { TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import { seedArenaTrainerOpeningTranscript } from './arenaTrainerDialogueTree';

type UseArenaTrainerTalkOptions = {
  active: boolean;
  questState: QuestState;
  onPlayerHealthChange?: (health: number) => void;
  onLeave: () => void;
};

export function useArenaTrainerTalk({
  active,
  questState,
  onPlayerHealthChange,
  onLeave,
}: UseArenaTrainerTalkOptions) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const { isCombatMode, startCombat, resetCombat, ...combatRest } = useCombatEncounter({
    encounterId: 'trainer',
    questState,
    onPlayerHealthChange,
  });

  const resetCombatRef = useRef(resetCombat);
  resetCombatRef.current = resetCombat;

  useEffect(() => {
    if (!active) return;
    resetCombatRef.current();
    setTranscript(seedArenaTrainerOpeningTranscript());
  }, [active]);

  useLayoutEffect(() => {
    if (isCombatMode) return;
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [transcript, isCombatMode]);

  const combat = { isCombatMode, startCombat, resetCombat, ...combatRest };

  const handleAttack = () => {
    startCombat();
  };

  const handleLeave = () => {
    resetCombat();
    onLeave();
  };

  return {
    transcript,
    logEndRef,
    combat,
    isCombatMode,
    handleAttack,
    handleLeave,
  };
}
