import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SHOW_QUEST_STEP_BACK } from '../constants';
import {
  DIALOGUE_DEV_MESSAGE_CLASSES,
  PLAY_TAB_PLAYER_LINE_SHELL,
  PLAY_TAB_PLAYER_LINE_TEXT_CHOICE,
} from '../DialogueVoiceBlock';
import { thrownItemLabelFromFlags } from '../constants';
import { interpolateStepText } from '../quests/engine';
import type { DialogueLogEntry, ModifierMap, QuestChoice, QuestDefinition, QuestStep } from '../quests/types';
import { NpcTalkDialog } from '../npc/NpcTalkDialog';
import { getQuestPopupPortraitSrc, getQuestStepImageSrc } from '../rpgArtAssignments';
import { npcTranscriptWithStepFallback } from '../quests/questPopupTranscript';
import {
  RPG_DIALOG_BODY,
  RPG_DIALOG_CHOICE_CLASS,
  RPG_DIALOG_META,
} from '../typography/rpgDialogTypography';
import {
  NARRATOR_RESPONSE_SPEAKER,
  PLAYER_ACTION_SPEAKER,
  QUEST_NARRATOR_PROMPT_SPEAKER,
} from '../dialogueFormat';
import { QUEST_TRANSITION_MS } from '../constants';

type QuestPopupProps = {
  quest: QuestDefinition;
  step: QuestStep;
  playerFlags: string[];
  /** Stackable counts (e.g. `item:*`); unlocks choices using `disabledUnlessModifiersAtLeast`. */
  playerModifiers: ModifierMap;
  questItems: string[];
  showOriginStartHint: boolean;
  /** Saved character name (used with `nameInput` fallback for `{playerName}` in step copy). */
  committedPlayerName: string;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  onInventoryPickSubmit?: (itemLabel: string) => void;
  /** Advance chained `message` steps with `nextStepId` (Continue). */
  onAdvanceQuestMessage?: () => void;
  onClose: () => void;
  presentation?: 'modal' | 'inline';
  /** Quest-attributed dialogue lines for this session (mirrors merchant-style transcript). */
  questTranscript: DialogueLogEntry[];
  /** Bracket visual choice transition — parent can defer instant play-feed snap (see `QUEST_TRANSITION_MS`). */
  onQuestChoiceVisualPhase?: (phase: 'start' | 'end') => void;
  /** Inline play feed: keep dialogue + options scrolled into view after layout changes. */
  onSnapPlayFeedBottom?: () => void;
  /** Dev: rewind one quest step (see `SHOW_QUEST_STEP_BACK`). */
  showQuestStepBack?: boolean;
  canQuestStepBack?: boolean;
  onQuestStepBack?: () => void;
};

function normalizePromptText(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

function choiceLockedByModifierMinimums(choice: QuestChoice, playerModifiers: ModifierMap): boolean {
  const req = choice.disabledUnlessModifiersAtLeast;
  if (!req) return false;
  return Object.entries(req).some(([key, min]) => (playerModifiers[key] ?? 0) < min);
}

function choiceIsVisible(choice: QuestChoice, playerFlags: Set<string>): boolean {
  const req = choice.enabledIfAnyFlags;
  if (!req || req.length === 0) return true;
  return req.some((flag) => playerFlags.has(flag));
}

function choiceDisabledSuffix(
  choice: QuestChoice,
  locked: { byFlags: boolean; byModifiers: boolean; byEmptyQuestItems: boolean }
): string {
  if (locked.byEmptyQuestItems) return ' (nothing in your pack)';
  if (choice.disabledLabel !== undefined) return choice.disabledLabel;
  if (locked.byFlags) return ' (already explored)';
  if (locked.byModifiers) return ' (requirements not met)';
  return ' (unavailable)';
}

function transcriptDisplayRole(
  entry: { speaker: string; text: string },
  openingPromptNormalized: string
): 'narrator' | 'narrator_prompt' | 'player' | 'neutral' {
  const openingNorm = openingPromptNormalized.trim().length > 0 ? normalizePromptText(openingPromptNormalized) : '';
  if (entry.speaker === QUEST_NARRATOR_PROMPT_SPEAKER) return 'narrator_prompt';
  if (
    entry.speaker === NARRATOR_RESPONSE_SPEAKER &&
    openingNorm.length > 0 &&
    normalizePromptText(entry.text) === openingNorm
  ) {
    return 'narrator_prompt';
  }
  if (entry.speaker === NARRATOR_RESPONSE_SPEAKER) return 'narrator';
  if (entry.speaker === PLAYER_ACTION_SPEAKER || entry.speaker === 'You') return 'player';
  return 'neutral';
}

/** Quest popup: main story beat — full ink (paper), not the same gold as choice buttons. */
const QUEST_POPUP_PROMPT_LINE_CLASSES =
  'rounded-r-md border-l-[3px] border-[var(--candle-flame)]/55 bg-black/45 py-2.5 pl-3 pr-2 font-cormorant text-lg font-semibold leading-snug tracking-wide text-[var(--candle-ink)] shadow-[inset_1px_0_0_rgba(230,161,87,0.2),0_1px_12px_rgba(0,0,0,0.35)] sm:text-xl';

const QUEST_POPUP_RESPONSE_LINE_CLASSES =
  'font-serif text-sm italic leading-relaxed text-[var(--candle-ink-soft)]';

/** Inline (Play tab): keep quest prompts lightweight (no bubble). */
const QUEST_POPUP_PROMPT_LINE_INLINE_CLASSES =
  'whitespace-pre-line font-serif text-[1rem] leading-relaxed text-[var(--candle-ink-soft)]';

export function QuestPopup({
  quest,
  step,
  playerFlags,
  playerModifiers,
  questItems,
  showOriginStartHint,
  committedPlayerName,
  nameInput,
  onNameInputChange,
  nameInputError,
  onStepChoice,
  onNameSubmit,
  onInventoryPickSubmit,
  onAdvanceQuestMessage,
  onClose,
  presentation = 'modal',
  questTranscript,
  onQuestChoiceVisualPhase,
  onSnapPlayFeedBottom,
  showQuestStepBack = SHOW_QUEST_STEP_BACK,
  canQuestStepBack = false,
  onQuestStepBack,
}: QuestPopupProps) {
  const playerFlagSet = new Set(playerFlags);
  const isOriginStartCard = quest.id === 'quest-001-origin' && step.id === 'start';
  const stepImageSrc = getQuestStepImageSrc(quest, step.id);
  const nameForTemplates = committedPlayerName.trim() || nameInput.trim();
  const startStep = quest.steps[quest.startStepId];
  const openingPromptNormalized = startStep
    ? normalizePromptText(interpolateStepText(startStep.text.trim(), nameForTemplates))
    : '';
  const thrownLabel = thrownItemLabelFromFlags(playerFlags);
  const narrativeText =
    step.text.trim().length > 0
      ? interpolateStepText(step.text.trim(), nameForTemplates, thrownLabel ? { thrownItem: thrownLabel } : undefined)
      : '';
  const isLocationPopupQuest = Boolean(quest.locationPopup);
  const [inventoryPickLabel, setInventoryPickLabel] = useState('');
  useEffect(() => {
    if (step.type === 'inventoryPick') {
      setInventoryPickLabel(questItems[0] ?? '');
    }
  }, [step.id, step.type, questItems]);
  const trimmedNameInput = nameInput.trim();
  const isValidInputStepName =
    step.type === 'input'
      ? trimmedNameInput.length >= (step.minLength ?? 2) && trimmedNameInput.length <= (step.maxLength ?? 32)
      : false;
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [departingStep, setDepartingStep] = useState<QuestStep | null>(null);
  const choiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const inlineBlockRef = useRef<HTMLDivElement | null>(null);
  const snapPlayFeedRef = useRef(onSnapPlayFeedBottom);
  const advanceMessageRef = useRef(onAdvanceQuestMessage);
  advanceMessageRef.current = onAdvanceQuestMessage;
  snapPlayFeedRef.current = onSnapPlayFeedBottom;
  const prevTranscriptLenRef = useRef(0);

  const burnInEntryIdSet = (() => {
    const curr = questTranscript.length;
    const prev = prevTranscriptLenRef.current;
    if (curr > prev) {
      return new Set(questTranscript.slice(prev).map((e) => e.id));
    }
    if (curr < prev) {
      return new Set(questTranscript.map((e) => e.id));
    }
    return new Set<string>();
  })();

  useEffect(() => {
    setPendingChoiceId(null);
    setDepartingStep(null);
  }, [step.id]);

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

  const stepNextStepId = 'nextStepId' in step ? step.nextStepId : undefined;

  /** Bridge `message` steps: narration is already in `questTranscript`; advance without an extra Continue tap when motion is default. */
  useEffect(() => {
    if (step.type !== 'message') return;
    if (step.completeQuest) return;
    if (!stepNextStepId) return;
    const advance = advanceMessageRef.current;
    if (typeof advance !== 'function') return;
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const id = window.setTimeout(() => advance(), 0);
    return () => window.clearTimeout(id);
  }, [step.id, step.type, step.completeQuest, stepNextStepId]);

  useEffect(() => {
    if (!departingStep || departingStep.id === step.id) return;
    if (bodyTimeoutRef.current) clearTimeout(bodyTimeoutRef.current);
    bodyTimeoutRef.current = setTimeout(() => {
      setDepartingStep(null);
      bodyTimeoutRef.current = null;
    }, QUEST_TRANSITION_MS);
  }, [departingStep, step.id]);

  useLayoutEffect(() => {
    prevTranscriptLenRef.current = questTranscript.length;
  }, [questTranscript]);

  /** Inline play feed handles scroll; modal keeps transcript pinned inside its own scroller. */
  useLayoutEffect(() => {
    if (presentation !== 'modal') return;
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [questTranscript, presentation]);

  const handleChoiceClick = (choiceId: string) => {
    if (pendingChoiceId) return;
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      onStepChoice(choiceId);
      return;
    }
    onQuestChoiceVisualPhase?.('start');
    setDepartingStep(step);
    setPendingChoiceId(choiceId);
    onStepChoice(choiceId);
    choiceTimeoutRef.current = setTimeout(() => {
      setPendingChoiceId(null);
      choiceTimeoutRef.current = null;
      onQuestChoiceVisualPhase?.('end');
    }, QUEST_TRANSITION_MS);
  };

  const showMessageContinue =
    step.type === 'message' &&
    Boolean(step.nextStepId) &&
    !step.completeQuest &&
    typeof onAdvanceQuestMessage === 'function' &&
    (typeof window === 'undefined' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const choicePaneVisible =
    step.type === 'choice' || step.type === 'input' || step.type === 'inventoryPick' || showMessageContinue;

  useLayoutEffect(() => {
    if (presentation !== 'inline') return;
    snapPlayFeedRef.current?.();
    requestAnimationFrame(() => snapPlayFeedRef.current?.());
  }, [presentation, questTranscript.length, step.id, step.type, choicePaneVisible]);

  useEffect(() => {
    if (presentation !== 'inline') return;
    const node = inlineBlockRef.current;
    if (!node) return;
    const ro = new ResizeObserver(() => snapPlayFeedRef.current?.());
    ro.observe(node);
    return () => ro.disconnect();
  }, [presentation, step.id, choicePaneVisible]);

  const shellClass =
    presentation === 'modal'
      ? 'flex h-[98%] max-h-[98dvh] min-h-0 w-[98%] flex-col rounded-xl border border-[var(--candle-rule)] bg-[rgba(8,7,6,0.96)] p-3 shadow-2xl'
      : 'flex w-full max-w-full min-w-0 flex-col p-0';

  const stepImageEl =
    !isOriginStartCard && stepImageSrc ? (
      <img
        src={stepImageSrc}
        alt={`${quest.title} illustration`}
        className="mx-auto aspect-[3/4] w-full max-w-[210px] shrink-0 rounded-md border border-[var(--candle-rule)] object-cover"
        loading="lazy"
      />
    ) : null;

  const dialogueLogEl = (
    <div
      className="space-y-3 px-3 py-2 pr-4 font-serif leading-normal"
      role="log"
      aria-label={`${quest.title} dialogue`}
    >
      {questTranscript.length > 0 ? (
        questTranscript.map((entry) => {
          const role = transcriptDisplayRole(entry, openingPromptNormalized);
          return (
            <p
              key={entry.id}
              className={cn(
                'whitespace-pre-line',
                burnInEntryIdSet.has(entry.id) && 'quest-transcript-burn-in',
                role === 'narrator' && QUEST_POPUP_RESPONSE_LINE_CLASSES,
                role === 'narrator_prompt' &&
                  (presentation === 'inline' ? QUEST_POPUP_PROMPT_LINE_INLINE_CLASSES : QUEST_POPUP_PROMPT_LINE_CLASSES),
                role === 'player' && 'text-[0.9375rem] font-medium text-[var(--candle-wax)]',
                role === 'neutral' && 'text-sm text-[var(--candle-ink-soft)]'
              )}
            >
              {role === 'player' ? (
                <>
                  <span className="font-semibold text-[var(--candle-ink)]">You: </span>
                  {entry.text}
                </>
              ) : (
                entry.text
              )}
            </p>
          );
        })
      ) : narrativeText.length > 0 ? (
        <p
          className={cn(
            'whitespace-pre-line',
            step.type === 'choice'
              ? presentation === 'inline'
                ? QUEST_POPUP_PROMPT_LINE_INLINE_CLASSES
                : QUEST_POPUP_PROMPT_LINE_CLASSES
              : QUEST_POPUP_RESPONSE_LINE_CLASSES
          )}
        >
          {narrativeText}
        </p>
      ) : null}
      <div ref={logEndRef} className="h-px" aria-hidden />
    </div>
  );

  const renderStepBackButton = (floating: boolean) =>
    showQuestStepBack && onQuestStepBack && choicePaneVisible ? (
      <div
        className={cn(
          'pointer-events-none z-20',
          floating ? 'absolute left-0.5 top-0.5' : 'relative mb-1 flex min-h-9 justify-start px-1'
        )}
      >
        <button
          type="button"
          onClick={onQuestStepBack}
          disabled={!canQuestStepBack}
          className="pointer-events-auto flex size-8 items-center justify-center rounded-full border border-[var(--candle-rule)] bg-black/75 text-[var(--candle-ink-soft)] shadow-[0_2px_10px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors hover:border-[var(--candle-flame-soft)]/50 hover:bg-black/90 hover:text-[var(--candle-wax)] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Go back one quest step"
          title="Back one step (dev)"
        >
          <ArrowLeft className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    ) : null;

  const renderChoicePane = (npcTalkLayout = false) => (
      <div className={cn('relative flex flex-col', npcTalkLayout ? 'gap-0 px-1' : 'gap-0.5 py-1 pr-4')}>
        {!npcTalkLayout ? renderStepBackButton(false) : null}
        {showMessageContinue ? (
          <div
            className={cn(
              'border-b border-[var(--candle-rule)]/80 px-1 pb-1.5',
              npcTalkLayout ? 'space-y-1' : 'space-y-2 pb-2'
            )}
          >
            <button
              type="button"
              onClick={() => onAdvanceQuestMessage?.()}
              className={
                npcTalkLayout
                  ? `${RPG_DIALOG_CHOICE_CLASS} text-emerald-300/90 hover:text-emerald-200`
                  : 'choice-line w-auto border-b border-transparent py-2 text-emerald-300 hover:text-emerald-200'
              }
            >
              Continue
            </button>
          </div>
        ) : null}

        {step.type === 'choice' ? (
          <div className="quest-body-layer space-y-2">
            {departingStep && departingStep.id !== step.id && departingStep.type === 'choice' ? (
              <div className="quest-body-depart space-y-2">
                <ul className="space-y-0">
                  {departingStep.choices.filter((choice) => choiceIsVisible(choice, playerFlagSet)).map((choice) => (
                    <li key={`depart-${choice.id}`} className="py-0.5">
                      <div className={PLAY_TAB_PLAYER_LINE_SHELL}>
                        <span
                          className={`choice-line play-quest-choice ${PLAY_TAB_PLAYER_LINE_TEXT_CHOICE} !text-[0.8125rem] sm:!text-[0.875rem]`}
                        >
                          {choice.label}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {showOriginStartHint ? (
              <p className={cn(DIALOGUE_DEV_MESSAGE_CLASSES, 'px-1')}>Select a line below to continue.</p>
            ) : null}
            <ul className="quest-body-arrive space-y-0">
              {step.choices.filter((choice) => choiceIsVisible(choice, playerFlagSet)).map((choice) => {
                const isPending = pendingChoiceId !== null;
                const isChosen = pendingChoiceId === choice.id;
                const isFading = isPending && !isChosen;
                const lockedByFlags = Boolean(
                  choice.disabledIfAnyFlags?.some((flag) => playerFlagSet.has(flag))
                );
                const lockedByModifiers = choiceLockedByModifierMinimums(choice, playerModifiers);
                const lockedByEmptyQuestItems =
                  choice.id === 'q2-well-throw' && questItems.length === 0;
                const isLocked = lockedByFlags || lockedByModifiers || lockedByEmptyQuestItems;
                const renderedLabel = isLocked
                  ? `${choice.label}${choiceDisabledSuffix(choice, {
                      byFlags: lockedByFlags,
                      byModifiers: lockedByModifiers,
                      byEmptyQuestItems: lockedByEmptyQuestItems,
                    })}`
                  : choice.label;
                const choiceButtonClass = npcTalkLayout
                  ? `${RPG_DIALOG_CHOICE_CLASS} ${isFading ? 'choice-fade-out' : ''} ${
                      isChosen ? 'choice-selected-flash' : ''
                    } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`
                  : `choice-line play-quest-choice ${PLAY_TAB_PLAYER_LINE_TEXT_CHOICE} !text-[0.8125rem] sm:!text-[0.875rem] ${
                      isFading ? 'choice-fade-out' : ''
                    } ${isChosen ? 'choice-selected-flash' : ''} ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`;
                return (
                  <li key={choice.id} className={npcTalkLayout ? 'py-0' : 'py-0.5'}>
                    {npcTalkLayout ? (
                      <button
                        type="button"
                        disabled={isPending || isLocked}
                        aria-disabled={isLocked || undefined}
                        className={choiceButtonClass}
                        onClick={() => {
                          if (isLocked) return;
                          handleChoiceClick(choice.id);
                        }}
                      >
                        {renderedLabel}
                      </button>
                    ) : (
                      <div className={PLAY_TAB_PLAYER_LINE_SHELL}>
                        <button
                          type="button"
                          disabled={isPending || isLocked}
                          aria-disabled={isLocked || undefined}
                          className={choiceButtonClass}
                          onClick={() => {
                            if (isLocked) return;
                            handleChoiceClick(choice.id);
                          }}
                        >
                          {renderedLabel}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {step.type === 'inventoryPick' ? (
          <div className={cn('space-y-2 px-1', npcTalkLayout && 'space-y-1.5')}>
            {questItems.length === 0 ? (
              <p className={npcTalkLayout ? RPG_DIALOG_META : 'font-serif text-sm text-[var(--candle-ink-faint)]'}>
                {step.emptyText ?? 'You have nothing to throw in.'}
              </p>
            ) : (
              <>
                <label
                  className={cn(
                    'block text-[var(--candle-ink-soft)]',
                    npcTalkLayout ? RPG_DIALOG_META : 'font-serif text-xs'
                  )}
                >
                  {step.text.trim() || 'Choose an item'}
                </label>
                <select
                  className={cn(
                    'w-full rounded border border-[var(--candle-rule)] bg-black/30 px-2 py-1 text-[var(--candle-ink)]',
                    npcTalkLayout ? RPG_DIALOG_BODY : 'font-serif text-sm'
                  )}
                  value={inventoryPickLabel}
                  onChange={(event) => setInventoryPickLabel(event.target.value)}
                >
                  {questItems.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!inventoryPickLabel.trim() || pendingChoiceId !== null}
                  onClick={() => onInventoryPickSubmit?.(inventoryPickLabel)}
                  className={
                    npcTalkLayout
                      ? `${RPG_DIALOG_CHOICE_CLASS} text-emerald-300/90 hover:text-emerald-200 disabled:opacity-50`
                      : 'choice-line w-auto border-b border-transparent py-2 text-emerald-300 hover:text-emerald-200 disabled:opacity-50'
                  }
                >
                  {step.submitLabel}
                </button>
              </>
            )}
          </div>
        ) : null}

        {step.type === 'input' ? (
          <div className="space-y-3 px-1">
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
  );

  const choiceBodyEl = (
    <div className="max-h-[min(50dvh,480px)] overflow-y-auto">{renderChoicePane(false)}</div>
  );

  const npcTalkTranscript = useMemo(
    () => npcTranscriptWithStepFallback(questTranscript, narrativeText),
    [questTranscript, narrativeText]
  );

  if (presentation === 'modal' && isLocationPopupQuest) {
    return (
      <NpcTalkDialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={quest.title}
        portraitSrc={getQuestPopupPortraitSrc(quest, step.id)}
        portraitAlt={quest.title}
        npcSpeakerLabel="Narrator"
        logAriaLabel={`${quest.title} dialogue`}
        transcript={npcTalkTranscript}
        logEndRef={logEndRef}
        choiceOverlay={renderStepBackButton(true)}
        choicePane={choicePaneVisible ? renderChoicePane(true) : null}
      />
    );
  }

  return (
    <div
      className={
        presentation === 'modal'
          ? 'absolute inset-0 z-30 flex items-center justify-center bg-black/45 p-0.5'
          : 'relative min-w-0'
      }
    >
      <section className={shellClass}>
        {presentation === 'modal' && !isOriginStartCard ? (
          <div className="mb-2 flex shrink-0 items-start justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[var(--candle-rule)] px-2 py-1 font-sans text-xs text-[var(--candle-ink-soft)] hover:text-[var(--candle-ink)]"
            >
              Close
            </button>
          </div>
        ) : null}

        <div
          className={cn(
            'flex min-w-0 flex-col gap-2',
            presentation === 'modal' && 'min-h-0 min-w-0 flex-1 overflow-hidden',
            presentation === 'inline' && 'overflow-visible pt-1'
          )}
        >
          {presentation === 'modal' ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-[var(--candle-rule)] bg-black/25">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-2 p-2">
                  {stepImageEl}
                  {dialogueLogEl}
                </div>
              </div>
              {choicePaneVisible ? (
                <div className="shrink-0 border-t border-[var(--candle-rule)] bg-black/30 px-1">
                  {choiceBodyEl}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {stepImageEl}
              <div
                ref={inlineBlockRef}
                className="flex min-w-0 flex-col overflow-hidden"
              >
                <div className="min-w-0 shrink-0 px-0.5">{dialogueLogEl}</div>
                {choicePaneVisible ? (
                  <div className="min-w-0 shrink-0 px-0.5">
                    {choiceBodyEl}
                  </div>
                ) : null}
                <div data-stick-scroll-bottom-sentinel="" aria-hidden className="h-px w-full shrink-0" />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
