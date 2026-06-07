import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCombatEncounter } from '@/components/rpg/combat/useCombatEncounter';
import {
  DOOR_APPROACH_HIDE_FLAG,
  DOOR_APPROACH_KNOCK_FLAG,
  DOOR_APPROACH_YELL_FLAG,
} from '@/components/rpg/constants';
import { appendPair, type DialogueChoice, type TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import { CARL_MAIN_CHOICES, seedCarlOpeningTranscript } from '@/components/rpg/quests/carlDoorDialogueTree';

type UseCarlDoorTalkOptions = {
  stepId: string;
  playerFlags: readonly string[];
  playerHealth: number;
  onPlayerHealthChange?: (health: number) => void;
  onCombatChromeChange?: (active: boolean) => void;
  onCombatVictory?: () => void;
};

export function useCarlDoorTalk({
  stepId,
  playerFlags,
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

  const doorApproachKey = playerFlags.includes(DOOR_APPROACH_YELL_FLAG)
    ? 'yell'
    : playerFlags.includes(DOOR_APPROACH_HIDE_FLAG)
      ? 'hide'
      : playerFlags.includes(DOOR_APPROACH_KNOCK_FLAG)
        ? 'knock'
        : 'default';

  useEffect(() => {
    resetCombat();
    setTranscript(seedCarlOpeningTranscript(playerFlags));
    setAskedDoor(false);
    setAskedSelf(false);
  }, [stepId, doorApproachKey, resetCombat]);

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
