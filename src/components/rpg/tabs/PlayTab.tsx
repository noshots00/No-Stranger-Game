import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  DialogueVoiceBlock,
  DIALOGUE_DEV_MESSAGE_CLASSES,
  PLAY_TAB_PLAYER_LINE_SHELL,
  PLAY_TAB_PLAYER_LINE_TEXT_CHOICE,
} from '../DialogueVoiceBlock';
import type { ChronicleSegment } from '../dialogueFormat';
import type { JournalLogEntry, QuestDefinition, QuestStep } from '../quests/types';
import { PlayLedgerDisclosure, PlayLedgerKicker } from './PlayLedgerDisclosure';
import { QuestsTab } from './QuestsTab';

type PlayLedgerTimelineRow =
  | { kind: 'story'; segment: ChronicleSegment; sortMs: number }
  | { kind: 'journal'; entry: JournalLogEntry; sortMs: number };

type PlayTabProps = {
  playFeedSegments: ChronicleSegment[];
  playJournalLines: readonly JournalLogEntry[];
  journalLog: readonly JournalLogEntry[];
  questTitleById: Record<string, string>;
  visibleQuests: QuestDefinition[];
  completedQuestIds: string[];
  onTrackQuest: (questId: string) => void;
  activeQuest: QuestDefinition | null;
  activeStep: QuestStep | null;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  visibleLocationActions: string[];
  showOriginStartHint: boolean;
  onLocationAction?: (actionLabel: string) => void;
  /** Player flag set; used by `disabledIfAnyFlags` on QuestChoice. */
  playerFlags: string[];
};

const CHOICE_FADE_MS = 1200;

export function PlayTab({
  playFeedSegments,
  playJournalLines,
  journalLog,
  questTitleById,
  visibleQuests,
  completedQuestIds,
  onTrackQuest,
  activeQuest,
  activeStep,
  nameInput,
  onNameInputChange,
  nameInputError,
  onStepChoice,
  onNameSubmit,
  dialogueScrollRef,
  onDialogueScroll,
  visibleLocationActions,
  showOriginStartHint,
  onLocationAction,
  playerFlags,
}: PlayTabProps) {
  const playerFlagSet = new Set(playerFlags);
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const choiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playLedgerRows = useMemo((): PlayLedgerTimelineRow[] => {
    const rows: Array<PlayLedgerTimelineRow & { seq: number }> = [];
    let seq = 0;
    for (const segment of playFeedSegments) {
      const sortMs = segment.type === 'world' ? segment.row.atMs : segment.lines[0]?.atMs ?? 0;
      rows.push({ kind: 'story', segment, sortMs, seq: seq++ });
    }
    for (const entry of playJournalLines) {
      rows.push({ kind: 'journal', entry, sortMs: entry.atMs, seq: seq++ });
    }
    rows.sort((a, b) => (a.sortMs !== b.sortMs ? a.sortMs - b.sortMs : a.seq - b.seq));
    return rows.map(({ seq: _seq, ...row }) => row);
  }, [playFeedSegments, playJournalLines]);

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

  return (
    <section className="flex h-full flex-col justify-end gap-1.5">
      <div
        ref={dialogueScrollRef}
        onScroll={onDialogueScroll}
        className="facsimile-scroll min-h-0 flex-1 overflow-y-auto pr-0"
      >
        <div className="facsimile-scroll-dialogue-inner space-y-2">
          {playLedgerRows.map((row, idx) => {
            if (row.kind === 'story') {
              const segment = row.segment;
              if (segment.type === 'world') {
                const wr = segment.row;
                return (
                  <p
                    key={`world-${wr.atMs}-${idx}-${wr.text.slice(0, 24)}`}
                    className="dialogue-line-reveal py-0.5 font-sans text-[0.6875rem] italic leading-snug text-[var(--candle-ember)]/80"
                  >
                    {wr.text}
                  </p>
                );
              }
              const first = segment.lines[0];
              return (
                <div
                  key={`${segment.role}-${first?.id ?? `b-${idx}`}`}
                  className="dialogue-line-reveal py-0.5"
                >
                  <DialogueVoiceBlock presentation="play" role={segment.role} lines={segment.lines} />
                </div>
              );
            }

            const je = row.entry;
            const title = questTitleById[je.questId] ?? 'Quest';
            return (
              <div key={je.id} className="dialogue-line-reveal py-0.5">
                <PlayLedgerDisclosure summary={<PlayLedgerKicker label="Journal" title={title} />}>
                  <p className="font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">{je.text}</p>
                  {je.completionRewards && je.completionRewards.length > 0 ? (
                    <>
                      <p className="font-serif text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                        Rewards
                      </p>
                      <ul className="list-disc space-y-1 pl-4 font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
                        {je.completionRewards.map((line, i) => (
                          <li key={`${je.id}-rw-${i}`}>{line}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </PlayLedgerDisclosure>
              </div>
            );
          })}
          <div className="dialogue-line-reveal border-t border-[var(--candle-rule)]/80 pt-3 mt-1">
            <QuestsTab
              visibleQuests={visibleQuests}
              completedQuestIds={completedQuestIds}
              journalLog={journalLog}
              activeQuestId={activeQuest?.id ?? null}
              onTrackQuest={onTrackQuest}
              trackButtonLabel="Start quest"
              showSectionKicker={false}
              showCompletedSection
            />
          </div>
          {activeQuest && activeStep ? (
            <div className="dialogue-line-reveal py-0.5">
              {activeStep.type === 'choice' ? (
                <div className="space-y-2">
                  {showOriginStartHint ? (
                    <p className={DIALOGUE_DEV_MESSAGE_CLASSES}>Select a line below to continue.</p>
                  ) : null}
                  <ul className="space-y-0 border-t border-[var(--candle-rule)]/80 pt-2">
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
                        <li key={choice.id} className="py-0.5">
                          <div className={PLAY_TAB_PLAYER_LINE_SHELL}>
                            <div className="space-y-1.5">
                              <button
                                type="button"
                                disabled={isPending || isLocked}
                                aria-disabled={isLocked || undefined}
                                className={`choice-line play-quest-choice ${PLAY_TAB_PLAYER_LINE_TEXT_CHOICE} ${isFading ? 'choice-fade-out' : ''} ${
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
                          </div>
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
          <div data-stick-scroll-bottom-sentinel="" aria-hidden className="h-px w-full shrink-0" />
        </div>
      </div>
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
    </section>
  );
}
