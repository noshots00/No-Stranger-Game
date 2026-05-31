import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCombatEncounter } from '@/components/rpg/combat/useCombatEncounter';
import { appendPair, type DialogueChoice, type TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import { CARL_MAIN_CHOICES, seedCarlOpeningTranscript } from '@/components/rpg/quests/carlDoorDialogueTree';

type UseCarlDoorTalkOptions = {
  stepId: string;
  playerHealth: number;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onCombatVictory?: () => void;
};

export function useCarlDoorTalk({
  stepId,
  playerHealth,
  onPlayerHealthChange,
  onCombatChromeChange,
  onCombatVictory,
}: UseCarlDoorTalkOptions) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [askedDoor, setAskedDoor] = useState(false);
  const [askedSelf, setAskedSelf] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isCombatMode,
    startCombat,
    resetCombat,
    ...combatRest
  } = useCombatEncounter({
    encounterId: 'carl',
    playerHealth,
    onPlayerHealthChange,
    onCombatChromeChange,
    onVictory: onCombatVictory,
  });

  const combat = { isCombatMode, startCombat, resetCombat, ...combatRest };

  useEffect(() => {
    resetCombat();
    setTranscript(seedCarlOpeningTranscript());
    setAskedDoor(false);
    setAskedSelf(false);
  }, [stepId, resetCombat]);

  useLayoutEffect(() => {
    if (isCombatMode) return;
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [transcript, isCombatMode]);

  const handleChoice = (choice: DialogueChoice) => {
    if (choice.type === 'combat') {
      startCombat();
      return;
    }
    if (choice.type !== 'reply') return;
    setTranscript((prev) => [...prev, ...appendPair(choice.label, choice.merchantText)]);
    if (choice.id === 'carl-ask-door') setAskedDoor(true);
    if (choice.id === 'carl-ask-self') setAskedSelf(true);
  };

  const talkChoices = CARL_MAIN_CHOICES.filter((c) => c.type !== 'combat' || !isCombatMode);

  return {
    transcript,
    logEndRef,
    askedDoor,
    askedSelf,
    handleChoice,
    mainChoices: talkChoices,
    combat,
    isCombatMode,
  };
}
