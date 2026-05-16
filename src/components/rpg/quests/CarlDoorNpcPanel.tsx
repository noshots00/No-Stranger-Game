import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { NpcTalkDialog } from '@/components/rpg/npc/NpcTalkDialog';
import { appendPair, type DialogueChoice, type TranscriptEntry } from '@/components/rpg/merchant/merchantDialogueTree';
import { CARL_FAREWELL_LABEL, CARL_MAIN_CHOICES, seedCarlOpeningTranscript } from '@/components/rpg/quests/carlDoorDialogueTree';

const CARL_PORTRAIT_SRC = publicAsset(
  'art/converted/batch-2026-05-02_21-10-35/atlantian-artist.webp'
);

type CarlDoorNpcPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Invokes quest engine choice `carl-farewell` (complete quest). */
  onFarewell: () => void;
};

export function CarlDoorNpcPanel({ open, onOpenChange, onFarewell }: CarlDoorNpcPanelProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [askedDoor, setAskedDoor] = useState(false);
  const [askedSelf, setAskedSelf] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setTranscript([]);
      setAskedDoor(false);
      setAskedSelf(false);
      return;
    }
    setTranscript(seedCarlOpeningTranscript());
    setAskedDoor(false);
    setAskedSelf(false);
  }, [open]);

  useLayoutEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [transcript]);

  const handleChoice = (choice: DialogueChoice) => {
    if (choice.type === 'reply') {
      setTranscript((prev) => [...prev, ...appendPair(choice.label, choice.merchantText)]);
      if (choice.id === 'carl-ask-door') setAskedDoor(true);
      if (choice.id === 'carl-ask-self') setAskedSelf(true);
    }
  };

  const choicePane = (
    <>
      {CARL_MAIN_CHOICES.map((c) => {
        const used = c.id === 'carl-ask-door' ? askedDoor : c.id === 'carl-ask-self' ? askedSelf : false;
        return (
          <button
            key={c.id}
            type="button"
            disabled={used}
            onClick={() => handleChoice(c)}
            className={`choice-line text-left text-[0.9rem] ${used ? 'cursor-not-allowed opacity-45' : ''}`}
          >
            {c.label}
            {used ? ' (already asked)' : ''}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onFarewell}
        className="choice-line border-t border-[var(--candle-rule)]/60 pt-2 text-left text-[0.92rem] font-medium text-[var(--candle-wax)]"
      >
        {CARL_FAREWELL_LABEL}
      </button>
    </>
  );

  return (
    <NpcTalkDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Carl"
      portraitSrc={CARL_PORTRAIT_SRC}
      portraitAlt="Carl"
      npcSpeakerLabel="Carl"
      logAriaLabel="Conversation with Carl"
      transcript={transcript}
      logEndRef={logEndRef}
      choicePane={choicePane}
    />
  );
}
