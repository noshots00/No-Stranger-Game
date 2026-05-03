import { useEffect, useRef, useState, type RefObject } from 'react';
import { DialogueVoiceBlock } from '../DialogueVoiceBlock';
import type { DialogueVoiceBlockModel } from '../dialogueFormat';
import { PLAY_DIALOGUE_RECENT_MAX } from '../constants';
import type { QuestDefinition, QuestStep, WorldEventLogEntry } from '../quests/types';
import { PlayStatusBar } from '../PlayStatusBar';
import { ChatPanel } from '../chat/ChatPanel';
import { getLocationGroupId } from '../chat/nip29Client';

type PlayTabProps = {
  playDialogueBlocks: DialogueVoiceBlockModel[];
  playWorldLines: WorldEventLogEntry[];
  activeQuest: QuestDefinition | null;
  activeStep: QuestStep | null;
  dialogueLogLength: number;
  worldEventLogLength: number;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  eventLogScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  visibleLocationActions: string[];
  showOriginStartHint: boolean;
  onLocationAction?: (actionLabel: string) => void;
  /** Player flag set; used by `disabledIfAnyFlags` on QuestChoice. */
  playerFlags: string[];
  /** Player health 0-100 for the status bar. */
  playerHealth: number;
  /** Wall-clock ms when the next in-game day rolls over (for "Reset in X.Yh"). */
  nextDayResetMs: number | null;
  /** Current location label, used to derive the per-location chat group. */
  currentLocation: string;
  /** Display name for the player's own messages. */
  characterNameLabel: string;
  /** Map pubkey -> display name for other players' chat messages. */
  speakerNameMap: Map<string, string>;
  /** True when player has set their character name; gates chat membership. */
  hasCharacter: boolean;
};

const CHOICE_FADE_MS = 1200;

export function PlayTab({
  playDialogueBlocks,
  playWorldLines,
  activeQuest,
  activeStep,
  dialogueLogLength,
  worldEventLogLength: _worldEventLogLength,
  nameInput,
  onNameInputChange,
  nameInputError,
  onStepChoice,
  onNameSubmit,
  dialogueScrollRef,
  eventLogScrollRef,
  onDialogueScroll,
  visibleLocationActions,
  showOriginStartHint,
  onLocationAction,
  playerFlags,
  playerHealth,
  nextDayResetMs,
  currentLocation,
  characterNameLabel,
  speakerNameMap,
  hasCharacter,
}: PlayTabProps) {
  const playerFlagSet = new Set(playerFlags);
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const choiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (choiceTimeoutRef.current) {
        clearTimeout(choiceTimeoutRef.current);
        choiceTimeoutRef.current = null;
      }
    };
  }, []);

  const handleChoiceClick = (choiceId: string) => {
    if (pendingChoiceId) return;
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onStepChoice(choiceId);
      return;
    }
    setPendingChoiceId(choiceId);
    choiceTimeoutRef.current = setTimeout(() => {
      onStepChoice(choiceId);
      setPendingChoiceId(null);
      choiceTimeoutRef.current = null;
    }, CHOICE_FADE_MS);
  };

  const visibleWorldLines = playWorldLines;

  return (
    <section className="flex h-full flex-col justify-end gap-1.5">
      <PlayStatusBar health={playerHealth} nextDayResetMs={nextDayResetMs} />
      <div
        ref={dialogueScrollRef}
        onScroll={onDialogueScroll}
        className="facsimile-scroll min-h-0 flex-1 overflow-y-auto pr-1"
      >
        <div className="space-y-2">
          {playDialogueBlocks.map((block, blockIndex) => (
            <div
              key={`${block.role}-${block.lines[0]?.id ?? `b-${blockIndex}`}`}
              className="dialogue-line-reveal py-0.5"
            >
              <DialogueVoiceBlock presentation="play" role={block.role} lines={block.lines} />
            </div>
          ))}
          {activeQuest && activeStep ? (
            <div className="dialogue-line-reveal py-0.5">
              {activeStep.type === 'choice' ? (
                <div className="space-y-2">
                  {showOriginStartHint ? (
                    <p className="facsimile-kicker px-0.5">Choose a reply to continue</p>
                  ) : null}
                  <ul className="space-y-0">
                    {activeStep.choices.map((choice) => {
                      const isPending = pendingChoiceId !== null;
                      const isChosen = pendingChoiceId === choice.id;
                      const isFading = isPending && !isChosen;
                      const isLocked = Boolean(
                        choice.disabledIfAnyFlags?.some((flag) => playerFlagSet.has(flag))
                      );
                      const renderedLabel = isLocked
                        ? `${choice.label}${choice.disabledLabel ?? ' (already explored)'}`
                        : choice.label;
                      return (
                        <li key={choice.id}>
                          <button
                            type="button"
                            disabled={isPending || isLocked}
                            aria-disabled={isLocked || undefined}
                            className={`choice-line ${isFading ? 'choice-fade-out' : ''} ${
                              isLocked ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => {
                              if (isLocked) return;
                              handleChoiceClick(choice.id);
                            }}
                          >
                            {renderedLabel}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              {activeStep.type === 'input' ? (
                <div className="mt-3 space-y-3 border-t border-[var(--candle-rule)] pt-4">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(event) => onNameInputChange(event.target.value)}
                    placeholder={activeStep.placeholder}
                    className="w-full border-b border-[var(--candle-rule)] bg-transparent px-0 py-2 font-serif text-sm text-[var(--candle-ink)] placeholder:text-[var(--candle-ink-faint)] focus:border-[var(--candle-flame-soft)] focus:outline-none"
                  />
                  {nameInputError ? (
                    <p className="font-serif text-xs text-rose-300/90">{nameInputError}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={onNameSubmit}
                    className="choice-line w-auto border-b border-transparent py-2 text-[var(--candle-wax)] hover:text-[var(--candle-ink)]"
                  >
                    {activeStep.submitLabel}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {dialogueLogLength > PLAY_DIALOGUE_RECENT_MAX ? (
        <p className="text-center font-serif text-[10px] text-[var(--candle-ink-faint)]">
          Showing the last {PLAY_DIALOGUE_RECENT_MAX} dialogue lines. Older lines are in the chronicle.
        </p>
      ) : null}
      {visibleLocationActions.length > 0 ? (
        <div className="space-y-2 border-t border-[var(--candle-rule)] pt-3">
          <div className="grid grid-cols-2 gap-2">
            {visibleLocationActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onLocationAction?.(action)}
                className="min-h-[44px] rounded-lg border border-transparent px-2 py-2 text-left font-serif text-sm text-[var(--candle-ink-soft)] transition-colors hover:border-[var(--candle-rule)] hover:text-[var(--candle-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--candle-flame-soft)]"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="echo-log py-1">
        <ChatPanel
          groupId={getLocationGroupId(currentLocation)}
          title={`${currentLocation} chat`}
          emptyHint=""
          worldEventLines={visibleWorldLines}
          listScrollRef={eventLogScrollRef}
          characterNameLabel={characterNameLabel}
          speakerNameMap={speakerNameMap}
          messageListClassName="max-h-[6.5rem]"
          hasCharacter={hasCharacter}
        />
      </div>
    </section>
  );
}
