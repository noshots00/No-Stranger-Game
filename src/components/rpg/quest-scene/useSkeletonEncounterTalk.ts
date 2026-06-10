import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCombatEncounter } from '@/components/rpg/combat/useCombatEncounter';
import type { QuestState } from '@/components/rpg/quests/types';
import type { DialogueChoice, TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';

const SKELETON_ATTACK_CHOICE: DialogueChoice = {
  id: 'skeleton-attack',
  type: 'combat',
  label: 'Attack',
};

type UseSkeletonEncounterTalkOptions = {
  stepId: string;
  openingLine: string;
  questState: QuestState;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onCombatComplete: () => void;
};

export function useSkeletonEncounterTalk({
  stepId,
  openingLine,
  questState,
  onPlayerHealthChange,
  onCombatChromeChange,
  onCombatComplete,
}: UseSkeletonEncounterTalkOptions) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(() => [
    { id: `skeleton-open-${stepId}`, role: 'narrator', text: openingLine },
  ]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isCombatMode,
    startCombat,
    resetCombat,
    ...combatRest
  } = useCombatEncounter({
    encounterId: 'skeleton',
    questState,
    onPlayerHealthChange,
    onCombatChromeChange,
    onVictory: onCombatComplete,
    onDefeat: onCombatComplete,
  });

  const combat = { isCombatMode, startCombat, resetCombat, ...combatRest };
  const resetCombatRef = useRef(resetCombat);
  resetCombatRef.current = resetCombat;

  useEffect(() => {
    resetCombatRef.current();
    setTranscript([{ id: `skeleton-open-${stepId}`, role: 'narrator', text: openingLine }]);
  }, [stepId, openingLine]);

  useLayoutEffect(() => {
    if (isCombatMode) return;
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [transcript, isCombatMode]);

  const handleChoice = (choice: DialogueChoice) => {
    if (choice.type === 'combat') {
      startCombat();
    }
  };

  return {
    transcript,
    logEndRef,
    handleChoice,
    attackChoice: SKELETON_ATTACK_CHOICE,
    combat,
    isCombatMode,
  };
}
