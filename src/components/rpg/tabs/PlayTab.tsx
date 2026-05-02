import { useEffect, useRef, useState, type RefObject } from 'react';
import { DialogueVoiceBlock } from '../DialogueVoiceBlock';
import type { DialogueVoiceBlockModel } from '../dialogueFormat';
import { PLAY_DIALOGUE_RECENT_MAX } from '../constants';
import type { QuestDefinition, QuestStep, WorldEventLogEntry } from '../quests/types';

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
}: PlayTabProps) {
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
      <div
        ref={dialogueScrollRef}
        onScroll={onDialogueScroll}
        className="facsimile-scroll min-h-0 flex-1 overflow-y-auto pr-1"
      >
        <div className="space-y-4">
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
                      return (
                        <li key={choice.id}>
                          <button
                            type="button"
                            disabled={isPending}
                            className={`choice-line ${isFading ? 'choice-fade-out' : ''}`}
                            onClick={() => handleChoiceClick(choice.id)}
                          >
                            {choice.label}
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
      <div className="echo-log flex flex-col gap-0.5 py-1">
        <div ref={eventLogScrollRef} className="facsimile-scroll -mr-3 h-[5.2rem] overflow-y-auto pr-1">
          {visibleWorldLines.length > 0 ? (
            <ul className="space-y-1 font-sans text-[11px] leading-snug">
              {visibleWorldLines.map((entry, index) => (
                <li
                  key={`${entry.atMs}-${index}-${entry.text}`}
                  className="italic text-[var(--candle-ember)]/80"
                >
                  {entry.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-[11px] italic leading-snug text-[var(--candle-ember)]/70">
              The road is quiet.
            </p>
          )}
        </div>
        <div className="flex items-end gap-1 border-t border-[var(--candle-rule)] pt-0.5">
          <input
            type="text"
            placeholder="Say something..."
            disabled
            className="flex-1 border-0 bg-transparent px-0 py-0 font-serif text-[11px] leading-none text-[var(--candle-ink-soft)] placeholder:text-[var(--candle-ink-faint)] opacity-70 focus:outline-none"
          />
          <button
            type="button"
            disabled
            className="px-0.5 py-0 font-serif text-[11px] leading-none text-[var(--candle-ink-faint)] opacity-70"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
