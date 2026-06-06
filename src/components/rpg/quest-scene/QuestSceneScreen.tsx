import { useEffect, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { thrownItemLabelFromFlags } from '../constants';
import { isContinueBridgeMessageStep, resolveQuestSceneTextBands } from '../quests/engine';
import { isTownHallTutorialAwaitStep } from '../village/villageTutorialQuests';
import type { ModifierMap, QuestChoice, QuestDefinition, QuestProgress, QuestStep } from '../quests/types';
import { getQuestCardImageSrc, getQuestScenePortraitAlt, getQuestScenePortraitSrc } from '../rpgArtAssignments';
import { QuestSceneNpcTalk } from './QuestSceneNpcTalk';
import {
  QUEST_SCENE_CHOICE,
  QUEST_SCENE_CHOICE_LABEL,
  QUEST_SCENE_CONTINUE,
  QUEST_SCENE_META,
  QUEST_SCENE_PROMPT,
  QUEST_SCENE_RESPONSE,
} from '../typography/rpgDialogTypography';
import { QuestChoiceEffectsHint } from '../dev/QuestChoiceEffectsHint';
import { formatChoiceStepDevLines, formatQuestChoiceDevLines } from '../dev/questChoiceEffectsDev';
import {
  choiceDisabledSuffix,
  choiceIsVisible,
  resolveChoiceLockState,
} from './questSceneStepHelpers';

/** Only very long labels span the full grid width. */
const CHOICE_FULL_WIDTH_MIN_CHARS = 48;

function choiceSpansFullWidth(label: string): boolean {
  return label.trim().length >= CHOICE_FULL_WIDTH_MIN_CHARS;
}

export type QuestSceneScreenProps = {
  quest: QuestDefinition;
  step: QuestStep;
  playerFlags: string[];
  playerModifiers: ModifierMap;
  questItems: string[];
  showOriginStartHint: boolean;
  committedPlayerName: string;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  onInventoryPickSubmit?: (itemLabel: string) => void;
  onAdvanceQuestMessage?: () => void;
  onDismissQuestScene?: () => void;
  showQuestChoiceEffects?: boolean;
  playerHealth?: number;
  onPlayerHealthChange?: (health: number) => void;
  questProgress?: QuestProgress;
};

export function QuestSceneScreen({
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
  onDismissQuestScene,
  showQuestChoiceEffects = false,
  playerHealth = 100,
  onPlayerHealthChange,
  questProgress,
}: QuestSceneScreenProps) {
  const [combatChrome, setCombatChrome] = useState(false);
  const handleCombatChromeChange = useCallback((active: boolean) => {
    setCombatChrome(active);
  }, []);
  const playerFlagSet = useMemo(() => new Set(playerFlags), [playerFlags]);
  const backgroundSrc = getQuestCardImageSrc(quest);
  const portraitSrc = getQuestScenePortraitSrc(quest, step);
  const portraitAlt = getQuestScenePortraitAlt(quest, step);
  const isNpcTalk = Boolean(step.npcTalkId);
  const nameForTemplates = committedPlayerName.trim() || nameInput.trim();
  const thrownLabel = thrownItemLabelFromFlags(playerFlags);
  const narrativeExtras = thrownLabel ? { thrownItem: thrownLabel } : undefined;
  const { response: beatResponse, prompt: beatPrompt } = resolveQuestSceneTextBands(
    quest,
    step,
    questProgress,
    nameForTemplates,
    narrativeExtras
  );

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

  const renderChoiceButton = (choice: QuestChoice, renderedLabel: string, isLocked: boolean) => (
    <button
      type="button"
      disabled={isLocked}
      aria-disabled={isLocked || undefined}
      className={cn(QUEST_SCENE_CHOICE, isLocked && 'cursor-not-allowed opacity-50')}
      onClick={() => {
        if (isLocked) return;
        onStepChoice(choice.id);
      }}
    >
      <span className={QUEST_SCENE_CHOICE_LABEL}>{renderedLabel}</span>
    </button>
  );

  return (
    <section
      className={cn('quest-scene-root', combatChrome && 'quest-scene-root--combat')}
    >
      <div className="quest-scene-stage rounded-t-md border border-x-0 border-b-0 border-[var(--candle-rule)]">
        <img src={backgroundSrc} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="quest-scene-stage-gradient absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/70" aria-hidden />
        <div className="quest-scene-stage-combat-vignette absolute inset-0" aria-hidden />
        <div className="quest-scene-portrait-anchor" aria-hidden>
          <div className="quest-scene-portrait-slot">
            <img
              key={portraitSrc}
              src={portraitSrc}
              alt={portraitAlt}
              className={cn('quest-scene-portrait', combatChrome && 'quest-scene-portrait--hostile')}
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {isNpcTalk ? (
        <QuestSceneNpcTalk
          npcTalkId={step.npcTalkId!}
          stepId={step.id}
          playerHealth={playerHealth}
          onPlayerHealthChange={onPlayerHealthChange}
          onCombatChromeChange={handleCombatChromeChange}
          onStepChoice={onStepChoice}
        />
      ) : (
        <>
      <div className="quest-scene-text-box rpg-panel facsimile-scroll border-x-0 px-2.5 py-2">
        {beatResponse.length > 0 || beatPrompt.length > 0 ? (
          <div className="space-y-1.5">
            {beatResponse.length > 0 ? (
              <p className={cn('whitespace-pre-line', QUEST_SCENE_RESPONSE)}>{beatResponse}</p>
            ) : null}
            {beatPrompt.length > 0 ? (
              <p className={cn('whitespace-pre-line', QUEST_SCENE_PROMPT)}>{beatPrompt}</p>
            ) : null}
          </div>
        ) : (
          <p className={cn('italic opacity-60', QUEST_SCENE_META)}>…</p>
        )}
      </div>

      <div className="quest-scene-action-box rpg-panel facsimile-scroll px-1.5 py-1">
        <div className="quest-scene-action-inner">
          {step.type === 'choice' && !step.npcTalkId ? (
            <>
              {showQuestChoiceEffects && step.worldEventLogAfterChoice?.length ? (
                <div className="mb-0.5 rounded border border-amber-500/25 bg-amber-950/30 px-1.5 py-0.5 font-mono text-[0.5625rem] leading-snug text-amber-100/80">
                  {formatChoiceStepDevLines(step).map((line) => (
                    <p key={line} className="break-words">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
              {showOriginStartHint ? (
                <p className={cn(QUEST_SCENE_META, 'px-0.5 py-0.5')}>Select a line below.</p>
              ) : null}
              <ul className="quest-scene-choice-grid">
                {step.choices.filter((choice) => choiceIsVisible(choice, playerFlagSet)).map((choice) => {
                  const lock = resolveChoiceLockState(choice, playerFlagSet, playerModifiers, questItems);
                  const renderedLabel = lock.isLocked
                    ? `${choice.label}${choiceDisabledSuffix(choice, {
                        byFlags: lock.lockedByFlags,
                        byModifiers: lock.lockedByModifiers,
                        byEmptyQuestItems: lock.lockedByEmptyQuestItems,
                      })}`
                    : choice.label;
                  const spanFull = choiceSpansFullWidth(renderedLabel);
                  return (
                    <li
                      key={choice.id}
                      className={cn(spanFull && 'quest-scene-choice-span-full')}
                    >
                      {renderChoiceButton(choice, renderedLabel, lock.isLocked)}
                      {showQuestChoiceEffects ? <QuestChoiceEffectsHint choice={choice} /> : null}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {step.type === 'message' && isContinueBridgeMessageStep(step) && onAdvanceQuestMessage ? (
            <button type="button" onClick={onAdvanceQuestMessage} className={QUEST_SCENE_CONTINUE}>
              Continue
            </button>
          ) : null}

          {step.type === 'message' &&
          isTownHallTutorialAwaitStep(quest.id, step.id) &&
          onDismissQuestScene ? (
            <button type="button" onClick={onDismissQuestScene} className={QUEST_SCENE_CONTINUE}>
              Okay
            </button>
          ) : null}

          {step.type === 'inventoryPick' && showQuestChoiceEffects && step.effects ? (
            <div className="mb-1 rounded border border-amber-500/25 bg-amber-950/30 px-1.5 py-0.5 font-mono text-[0.5625rem] text-amber-100/80">
              <p className="text-[0.55rem] uppercase tracking-[0.08em] text-amber-200/70">step {step.id}</p>
              <ul className="mt-0.5 list-none space-y-0.5">
                {formatQuestChoiceDevLines({
                  id: 'inventoryPick',
                  label: step.submitLabel,
                  nextStepId: step.nextStepId,
                  effects: step.effects,
                }).map((line) => (
                  <li key={line} className="break-words">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {step.type === 'inventoryPick' ? (
            <div className="space-y-1 px-0.5">
              {questItems.length === 0 ? (
                <p className={QUEST_SCENE_META}>{step.emptyText ?? 'You have nothing to throw in.'}</p>
              ) : (
                <>
                  <label className={cn('block', QUEST_SCENE_META)}>{step.text.trim() || 'Choose an item'}</label>
                  <select
                    className="w-full rounded border border-[var(--candle-rule)] bg-black/30 px-1.5 py-1 font-serif text-[12px] text-[var(--candle-ink)]"
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
                    disabled={!inventoryPickLabel.trim()}
                    onClick={() => onInventoryPickSubmit?.(inventoryPickLabel)}
                    className={QUEST_SCENE_CONTINUE}
                  >
                    {step.submitLabel}
                  </button>
                </>
              )}
            </div>
          ) : null}

          {step.type === 'input' ? (
            <div className="space-y-1 px-0.5 py-0.5">
              <input
                type="text"
                value={nameInput}
                onChange={(event) => onNameInputChange(event.target.value)}
                placeholder={step.placeholder}
                className="w-full border-b border-[var(--candle-rule)] bg-transparent px-0 py-1 font-serif text-[12px] text-[var(--candle-ink)] placeholder:text-sky-300/80 focus:border-[var(--candle-flame-soft)] focus:outline-none"
              />
              {nameInputError ? (
                <p className="font-serif text-[10px] text-rose-300/90">{nameInputError}</p>
              ) : null}
              <button
                type="button"
                onClick={onNameSubmit}
                className={cn(
                  QUEST_SCENE_CONTINUE,
                  !isValidInputStepName && 'text-red-300 hover:text-red-200'
                )}
              >
                {step.submitLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
        </>
      )}
    </section>
  );
}
