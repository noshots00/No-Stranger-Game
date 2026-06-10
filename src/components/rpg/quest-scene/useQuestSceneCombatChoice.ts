import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCombatEncounter } from '@/components/rpg/combat/useCombatEncounter';
import type { CombatEncounterId } from '@/components/rpg/combat/combatEncounters';
import type { QuestChoice, QuestStep, QuestState } from '@/components/rpg/quests/types';

type UseQuestSceneCombatChoiceOptions = {
  step: QuestStep;
  questState: QuestState;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onStepChoice: (choiceId: string) => void;
};

function findCombatChoice(step: QuestStep): QuestChoice | undefined {
  if (step.type !== 'choice') return undefined;
  return step.choices.find((choice) => choice.combatEncounterId);
}

export function useQuestSceneCombatChoice({
  step,
  questState,
  onPlayerHealthChange,
  onCombatChromeChange,
  onStepChoice,
}: UseQuestSceneCombatChoiceOptions) {
  const combatChoice = useMemo(() => findCombatChoice(step), [step]);
  const pendingChoiceIdRef = useRef<string | null>(null);

  const completeCombat = useCallback(() => {
    const choiceId = pendingChoiceIdRef.current;
    pendingChoiceIdRef.current = null;
    if (choiceId) onStepChoice(choiceId);
  }, [onStepChoice]);

  const encounterId: CombatEncounterId = combatChoice?.combatEncounterId ?? 'skeleton';

  const combat = useCombatEncounter({
    encounterId,
    questState,
    onPlayerHealthChange,
    onCombatChromeChange,
    onVictory: completeCombat,
    onDefeat: completeCombat,
  });

  const resetCombatRef = useRef(combat.resetCombat);
  resetCombatRef.current = combat.resetCombat;

  useEffect(() => {
    resetCombatRef.current();
    pendingChoiceIdRef.current = null;
  }, [step.id]);

  const handleCombatChoiceClick = useCallback(
    (choice: QuestChoice) => {
      if (!choice.combatEncounterId) return;
      pendingChoiceIdRef.current = choice.id;
      combat.startCombat();
    },
    [combat.startCombat]
  );

  return {
    combatChoice,
    combat,
    handleCombatChoiceClick,
    isCombatMode: Boolean(combatChoice) && combat.isCombatMode,
  };
}
