import { useEffect, useRef, useState } from 'react';
import {
  DIALOGUE_DEV_MESSAGE_CLASSES,
  PLAY_TAB_PLAYER_LINE_SHELL,
  PLAY_TAB_PLAYER_LINE_TEXT_CHOICE,
} from '../DialogueVoiceBlock';
import { interpolateStepText } from '../quests/engine';
import type { QuestDefinition, QuestStep } from '../quests/types';
import { getQuestStepImageSrc } from '../rpgArtAssignments';

const CHOICE_FADE_MS = 160;
const BODY_CROSSFADE_MS = 320;

type QuestPopupProps = {
  quest: QuestDefinition;
  step: QuestStep;
  playerFlags: string[];
  showOriginStartHint: boolean;
  /** Saved character name (used with `nameInput` fallback for `{playerName}` in step copy). */
  committedPlayerName: string;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  /** Continue past narrator `message` steps that chain via `nextStepId`. */
  onAdvanceQuestMessage?: () => void;
  onClose: () => void;
  presentation?: 'modal' | 'inline';
};

export function QuestPopup({
  quest,
  step,
  playerFlags,
  showOriginStartHint,
  committedPlayerName,
  nameInput,
  onNameInputChange,
  nameInputError,
  onStepChoice,
  onNameSubmit,
  onAdvanceQuestMessage,
  onClose,
  presentation = 'modal',
}: QuestPopupProps) {
  const playerFlagSet = new Set(playerFlags);
  const isOriginStartCard = quest.id === 'quest-001-origin' && step.id === 'start';
  const stepImageSrc = getQuestStepImageSrc(quest, step.id);
  const nameForTemplates = committedPlayerName.trim() || nameInput.trim();
  const narrativeText =
    step.text.trim().length > 0 ? interpolateStepText(step.text.trim(), nameForTemplates) : '';
  const trimmedNameInput = nameInput.trim();
  const isValidInputStepName =
    step.type === 'input'
      ? trimmedNameInput.length >= (step.minLength ?? 2) && trimmedNameInput.length <= (step.maxLength ?? 32)
      : false;
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [departingStep, setDepartingStep] = useState<QuestStep | null>(null);
  const choiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (choiceTimeoutRef.current) {
        clearTimeout(choiceTimeoutRef.current);
        choiceTimeoutRef.current = null;
      }
      if (bodyTimeoutRef.current) {
        clearTimeout(bodyTimeoutRef.current);
        bodyTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!departingStep || departingStep.id === step.id) return;
    if (bodyTimeoutRef.current) clearTimeout(bodyTimeoutRef.current);
    bodyTimeoutRef.current = setTimeout(() => {
      setDepartingStep(null);
      bodyTimeoutRef.current = null;
    }, BODY_CROSSFADE_MS);
  }, [departingStep, step.id]);

  const handleChoiceClick = (choiceId: string) => {
    if (pendingChoiceId) return;
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onStepChoice(choiceId);
      return;
    }
    setDepartingStep(step);
    setPendingChoiceId(choiceId);
    choiceTimeoutRef.current = setTimeout(() => {
      onStepChoice(choiceId);
      setPendingChoiceId(null);
      choiceTimeoutRef.current = null;
    }, CHOICE_FADE_MS);
  };

  const shellClass =
    presentation === 'modal'
      ? 'flex h-[98%] w-[98%] flex-col rounded-xl border border-[var(--candle-rule)] bg-[rgba(8,7,6,0.96)] p-3 shadow-2xl'
      : 'flex w-full flex-col p-0';

  return (
    <div
      className={
        presentation === 'modal'
          ? 'absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-0.5'
          : 'relative'
      }
    >
      <section className={shellClass}>
        {presentation === 'modal' && !isOriginStartCard ? (
          <div className="mb-2 flex items-start justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[var(--candle-rule)] px-2 py-1 font-sans text-xs text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]"
            >
              Close
            </button>
          </div>
        ) : null}
        <div className="facsimile-scroll min-h-0 flex-1 overflow-y-auto pr-0">
          <div key={step.id} className="facsimile-scroll-dialogue-inner quest-step-enter space-y-3">
            {!isOriginStartCard && stepImageSrc ? (
              <img
                src={stepImageSrc}
                alt={`${quest.title} illustration`}
                className="mx-auto aspect-[3/4] w-full max-w-[210px] rounded-md border border-[var(--candle-rule)] object-cover"
                loading="lazy"
              />
            ) : null}
            {narrativeText.length > 0 ? (
              <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
                {narrativeText}
              </p>
            ) : null}

            {step.type === 'message' &&
            Boolean(step.nextStepId) &&
            !step.completeQuest &&
            typeof onAdvanceQuestMessage === 'function' ? (
              <div className="space-y-2 border-t border-[var(--candle-rule)] pt-3">
                <button
                  type="button"
                  onClick={() => onAdvanceQuestMessage()}
                  className="choice-line w-auto border-b border-transparent py-2 text-emerald-300 hover:text-emerald-200"
                >
                  Continue
                </button>
              </div>
            ) : null}

            {step.type === 'choice' ? (
              <div className="quest-body-layer space-y-2">
                {departingStep && departingStep.id !== step.id && departingStep.type === 'choice' ? (
                  <div className="quest-body-depart space-y-2">
                    <ul className="space-y-0 border-t border-[var(--candle-rule)]/80 pt-2">
                      {departingStep.choices.map((choice) => (
                        <li key={`depart-${choice.id}`} className="py-0.5">
                          <div className={PLAY_TAB_PLAYER_LINE_SHELL}>
                            <span className={`choice-line play-quest-choice ${PLAY_TAB_PLAYER_LINE_TEXT_CHOICE}`}>
                              {choice.label}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {showOriginStartHint ? (
                  <p className={DIALOGUE_DEV_MESSAGE_CLASSES}>Select a line below to continue.</p>
                ) : null}
                <ul className="quest-body-arrive space-y-0 border-t border-[var(--candle-rule)]/80 pt-2">
                  {step.choices.map((choice) => {
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
                      <li key={choice.id} className="py-0.5">
                        <div className={PLAY_TAB_PLAYER_LINE_SHELL}>
                          <button
                            type="button"
                            disabled={isPending || isLocked}
                            aria-disabled={isLocked || undefined}
                            className={`choice-line play-quest-choice ${PLAY_TAB_PLAYER_LINE_TEXT_CHOICE} ${isFading ? 'choice-fade-out' : ''} ${
                              isChosen ? 'choice-selected-flash' : ''
                            } ${
                              isLocked ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                            onClick={() => {
                              if (isLocked) return;
                              handleChoiceClick(choice.id);
                            }}
                          >
                            {renderedLabel}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {step.type === 'input' ? (
              <div className="space-y-3 border-t border-[var(--candle-rule)] pt-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(event) => onNameInputChange(event.target.value)}
                  placeholder={step.placeholder}
                  className="w-full border-b border-[var(--candle-rule)] bg-transparent px-0 py-2 font-serif text-sm text-[var(--candle-ink)] placeholder:text-sky-300/80 focus:border-[var(--candle-flame-soft)] focus:outline-none"
                />
                {nameInputError ? (
                  <p className="font-serif text-xs text-rose-300/90">{nameInputError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={onNameSubmit}
                  className={`choice-line w-auto border-b border-transparent py-2 ${
                    isValidInputStepName ? 'text-emerald-300 hover:text-emerald-200' : 'text-red-300 hover:text-red-200'
                  }`}
                >
                  {step.submitLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
