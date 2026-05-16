import { useEffect, useMemo, useState, type RefObject } from 'react';
import { DialogueVoiceBlock } from '../DialogueVoiceBlock';
import type { ChronicleSegment } from '../dialogueFormat';
import type { DialogueLogEntry, JournalLogEntry, ModifierMap, QuestDefinition, QuestStep } from '../quests/types';
import { getQuestCardImageSrc } from '../rpgArtAssignments';
import { ORIGIN_QUEST_OPENED_FLAG, QUEST_004_B_CARL_HUB_STEP_ID, QUEST_004_B_THE_DOOR_ID } from '../constants';
import { QuestPopup } from './QuestPopup';

const QUEST_2B_WILL_I_STARVE_ID = 'quest-002-b-will-i-starve';

type PlayLedgerTimelineRow =
  | { kind: 'story'; segment: ChronicleSegment; sortMs: number }
  | { kind: 'journal_group'; entries: JournalLogEntry[]; sortMs: number; groupKey: string };

type PlayTabProps = {
  playFeedSegments: ChronicleSegment[];
  playJournalLines: readonly JournalLogEntry[];
  newQuestIds: readonly string[];
  questTitleById: Record<string, string>;
  questById: Record<string, QuestDefinition>;
  visibleQuests: QuestDefinition[];
  completedQuestIds: string[];
  onOpenQuestPopup: (questId: string) => void;
  onCloseQuestPopup: () => void;
  questPopupQuestId: string | null;
  onAcknowledgeQuest: (questId: string) => void;
  activeQuest: QuestDefinition | null;
  activeStep: QuestStep | null;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  nameInputError: string | null;
  onStepChoice: (choiceId: string) => void;
  onNameSubmit: () => void;
  /** Advance chained `message` steps with `nextStepId` (Continue). */
  onAdvanceQuestMessage?: () => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  visibleLocationActions: string[];
  showOriginStartHint: boolean;
  /** Persisted name from quest state (popup interpolates `{playerName}`). */
  committedPlayerName: string;
  onLocationAction?: (actionLabel: string) => void;
  /** Player flag set; used by `disabledIfAnyFlags` on QuestChoice. */
  playerFlags: string[];
  /** Stackable item/stat tallies; used by `disabledUnlessModifiersAtLeast` on QuestChoice. */
  playerModifiers: ModifierMap;
  /** Narrative lines for the active quest popup (sourced from `dialogueLog`). */
  activeQuestTranscript: DialogueLogEntry[];
  useQuestPopupFallback: boolean;
  /** Brackets inline quest choice visual transition for play-feed scroll choreography. */
  onQuestChoiceVisualPhase?: (phase: 'start' | 'end') => void;
};

export function PlayTab({
  playFeedSegments,
  playJournalLines,
  newQuestIds,
  questTitleById,
  questById,
  visibleQuests,
  completedQuestIds,
  onOpenQuestPopup,
  onCloseQuestPopup,
  questPopupQuestId,
  onAcknowledgeQuest: _onAcknowledgeQuest,
  activeQuest,
  activeStep,
  nameInput,
  onNameInputChange,
  nameInputError,
  onStepChoice,
  onNameSubmit,
  onAdvanceQuestMessage,
  dialogueScrollRef,
  onDialogueScroll,
  visibleLocationActions,
  showOriginStartHint,
  committedPlayerName,
  onLocationAction,
  playerFlags,
  playerModifiers,
  activeQuestTranscript,
  useQuestPopupFallback,
  onQuestChoiceVisualPhase,
}: PlayTabProps) {
  const playLedgerRows = useMemo((): PlayLedgerTimelineRow[] => {
    const rows: Array<PlayLedgerTimelineRow & { seq: number }> = [];
    let seq = 0;
    for (const segment of playFeedSegments) {
      const sortMs = segment.type === 'world' ? segment.row.atMs : segment.lines[0]?.atMs ?? 0;
      rows.push({ kind: 'story', segment, sortMs, seq: seq++ });
    }

    const dayReports = playFeedSegments
      .map((segment, index) => {
        if (segment.type !== 'dialogueBlock' || segment.role !== 'report') return null;
        const firstLine = segment.lines[0];
        if (!firstLine) return null;
        if (!/^Day\s+\d+\s+Report$/i.test(firstLine.text.trim())) return null;
        return { atMs: firstLine.atMs, key: `report-${index}-${firstLine.id}` };
      })
      .filter((entry): entry is { atMs: number; key: string } => entry !== null)
      .sort((a, b) => a.atMs - b.atMs);

    const sortedJournalEntries = [...playJournalLines].sort((a, b) => a.atMs - b.atMs);
    const entriesByReport = new Map<string, JournalLogEntry[]>();
    const trailingEntries: JournalLogEntry[] = [];
    for (const entry of sortedJournalEntries) {
      const matchingReport = dayReports.find((report) => entry.atMs <= report.atMs);
      if (!matchingReport) {
        trailingEntries.push(entry);
        continue;
      }
      if (!entriesByReport.has(matchingReport.key)) entriesByReport.set(matchingReport.key, []);
      entriesByReport.get(matchingReport.key)!.push(entry);
    }

    for (const report of dayReports) {
      const entries = entriesByReport.get(report.key);
      if (!entries || entries.length === 0) continue;
      rows.push({
        kind: 'journal_group',
        entries,
        sortMs: entries[0].atMs,
        groupKey: report.key,
        seq: seq++,
      });
    }
    if (trailingEntries.length > 0) {
      rows.push({
        kind: 'journal_group',
        entries: trailingEntries,
        sortMs: trailingEntries[0].atMs,
        groupKey: 'trailing-journal',
        seq: seq++,
      });
    }

    rows.sort((a, b) => (a.sortMs !== b.sortMs ? a.sortMs - b.sortMs : a.seq - b.seq));
    return rows.map(({ seq: _seq, ...row }) => row);
  }, [playFeedSegments, playJournalLines]);
  const completedQuestIdSet = useMemo(() => new Set(completedQuestIds), [completedQuestIds]);
  const activeQuestRows = useMemo(
    () => visibleQuests.filter((q) => !completedQuestIdSet.has(q.id)),
    [visibleQuests, completedQuestIdSet]
  );
  const [frozenLedgerRows, setFrozenLedgerRows] = useState<PlayLedgerTimelineRow[] | null>(null);
  const [frozenActiveQuestRows, setFrozenActiveQuestRows] = useState<QuestDefinition[] | null>(null);
  useEffect(() => {
    if (questPopupQuestId) {
      if (!frozenLedgerRows) setFrozenLedgerRows(playLedgerRows);
      if (!frozenActiveQuestRows) setFrozenActiveQuestRows(activeQuestRows);
      return;
    }
    if (frozenLedgerRows) setFrozenLedgerRows(null);
    if (frozenActiveQuestRows) setFrozenActiveQuestRows(null);
  }, [
    questPopupQuestId,
    playLedgerRows,
    activeQuestRows,
    frozenLedgerRows,
    frozenActiveQuestRows,
  ]);
  const renderedLedgerRows = frozenLedgerRows ?? playLedgerRows;
  const renderedActiveQuestRows = frozenActiveQuestRows ?? activeQuestRows;
  const popupQuest =
    questPopupQuestId && activeQuest?.id === questPopupQuestId ? activeQuest : null;
  const popupStep = popupQuest ? activeStep : null;
  const hasOpenedOriginQuest = playerFlags.includes(ORIGIN_QUEST_OPENED_FLAG);
  const resolveQuestBriefing = (questId: string, defaultBriefing: string): string =>
    questId === 'quest-001-origin' && hasOpenedOriginQuest
      ? 'Welcome to No Stranger Game'
      : defaultBriefing;

  const renderQuestCardHeader = ({
    quest,
    title,
    briefingText,
    isNew,
    interactive,
    onOpen,
  }: {
    quest: QuestDefinition;
    title: string;
    briefingText: string;
    isNew: boolean;
    interactive: boolean;
    onOpen?: () => void;
  }) => {
    const cardSrc = getQuestCardImageSrc(quest);
    const titleOverlayBlock = (
      <div className="mx-auto w-full max-w-[260px]">
        <div className="relative overflow-hidden rounded border border-[var(--candle-rule)] shadow-[0_10px_32px_rgba(0,0,0,0.35)]">
          <img
            src={cardSrc}
            alt={`${title} illustration`}
            className="aspect-[3/4] w-full object-cover"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent px-3 pb-10 pt-3">
            <p className="text-center font-serif text-base font-semibold tracking-wide text-[var(--candle-wax)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {title}
            </p>
          </div>
          {isNew ? (
            <span className="absolute right-2 top-2 rounded border border-[var(--candle-flame-soft)]/55 bg-[var(--candle-flame-soft)]/15 px-1.5 py-0.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-[var(--candle-wax)]">
              New
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-center font-serif text-[0.8125rem] text-[var(--candle-ink-faint)]">{briefingText}</p>
      </div>
    );

    const image = (
      <img
        src={cardSrc}
        alt={`${title} illustration`}
        className="aspect-[3/4] w-[150px] shrink-0 rounded border border-[var(--candle-rule)] object-cover"
        loading="lazy"
      />
    );
    const titleAndBriefing = (
      <div className="relative flex min-h-[200px] w-[260px] min-w-0 flex-col items-center justify-center text-center">
        {isNew ? (
          <span className="absolute top-0 rounded border border-[var(--candle-flame-soft)]/45 bg-[var(--candle-flame-soft)]/10 px-1.5 py-0.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-[var(--candle-wax)]">
            New
          </span>
        ) : null}
        <p className="font-serif text-base text-[var(--candle-flame-soft)]">{title}</p>
        <p className="font-serif text-[0.8125rem] text-[var(--candle-ink-faint)]">{briefingText}</p>
      </div>
    );
    const imageOnRight = quest.id === QUEST_2B_WILL_I_STARVE_ID;
    const content =
      quest.questCardLayout === 'title-overlay' ? (
        titleOverlayBlock
      ) : (
        <div className="flex items-start justify-center gap-3">
          {imageOnRight ? (
            <>
              {titleAndBriefing}
              {image}
            </>
          ) : (
            <>
              {image}
              {titleAndBriefing}
            </>
          )}
        </div>
      );

    if (!interactive) {
      return <div className="w-full py-2 text-left font-serif">{content}</div>;
    }

    return (
      <button type="button" onClick={onOpen} className="w-full py-2 text-left font-serif hover:bg-black/15">
        {content}
      </button>
    );
  };

  return (
    <section className="relative flex h-full flex-col gap-1.5">
      <div
        ref={dialogueScrollRef}
        onScroll={onDialogueScroll}
        className="facsimile-scroll min-h-0 flex-1 overflow-y-auto pr-0 [scroll-padding-bottom:min(42dvh,320px)]"
      >
        <div className="facsimile-scroll-dialogue-inner !pl-[16px] !pr-[16px] space-y-2">
          {renderedLedgerRows.map((row, idx) => {
            if (row.kind === 'story') {
              const segment = row.segment;
              if (segment.type === 'world') {
                const wr = segment.row;
                return (
                  <div key={`world-${wr.atMs}-${idx}-${wr.text.slice(0, 24)}`} className="dialogue-line-reveal py-0.5">
                    <p className="font-sans text-[0.6875rem] italic leading-snug text-[var(--candle-ember)]/80">
                      {wr.text}
                    </p>
                  </div>
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

            const dayEntries = row.entries;
            return (
              <div key={`journal-group-${row.groupKey}`} className="py-0.5">
                <div className="space-y-3">
                  <div className="space-y-3">
                    {dayEntries.map((je) => {
                      const title = questTitleById[je.questId] ?? 'Quest';
                      const questDef = questById[je.questId];
                      if (!questDef) return null;
                      const summaryText = je.text.trim();
                      const briefingText = resolveQuestBriefing(je.questId, questDef.briefing.trim());
                      return (
                        <div key={je.id} className="space-y-1 border-b border-[var(--candle-rule)]/40 pb-2 last:border-b-0 last:pb-0">
                          {renderQuestCardHeader({
                            quest: questDef,
                            title,
                            briefingText,
                            isNew: false,
                            interactive: false,
                          })}
                          {summaryText.length > 0 ? (
                            <div className="quest-body-transition space-y-2 pt-2">
                              <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
                                {summaryText}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {renderedActiveQuestRows.map((quest) => {
            const isNew = newQuestIds.includes(quest.id);
            const briefingText = resolveQuestBriefing(quest.id, quest.briefing);
            const showInlineQuest =
              !useQuestPopupFallback &&
              questPopupQuestId === quest.id &&
              activeQuest?.id === quest.id &&
              Boolean(activeStep);
            const suppressQuestPopupForCarlNpc =
              quest.id === QUEST_004_B_THE_DOOR_ID &&
              activeQuest?.id === quest.id &&
              activeStep?.id === QUEST_004_B_CARL_HUB_STEP_ID;
            return (
              <div key={`active-journal-${quest.id}`} className="py-0.5">
                <div className="space-y-2">
                  {renderQuestCardHeader({
                    quest,
                    title: quest.title,
                    briefingText,
                    isNew,
                    interactive: !showInlineQuest,
                    onOpen: () => onOpenQuestPopup(quest.id),
                  })}
                  {suppressQuestPopupForCarlNpc && showInlineQuest ? (
                    <p className="px-0.5 font-serif text-sm italic text-[var(--candle-ink-faint)]">
                      Conversation continues in the scene above.
                    </p>
                  ) : null}
                  {showInlineQuest && activeQuest && activeStep && !suppressQuestPopupForCarlNpc ? (
                    <QuestPopup
                      quest={activeQuest}
                      step={activeStep}
                      playerFlags={playerFlags}
                      playerModifiers={playerModifiers}
                      showOriginStartHint={showOriginStartHint}
                      committedPlayerName={committedPlayerName}
                      nameInput={nameInput}
                      onNameInputChange={onNameInputChange}
                      nameInputError={nameInputError}
                      onStepChoice={onStepChoice}
                      onNameSubmit={onNameSubmit}
                      onAdvanceQuestMessage={onAdvanceQuestMessage}
                      onClose={onCloseQuestPopup}
                      presentation="inline"
                      questTranscript={activeQuestTranscript}
                      onQuestChoiceVisualPhase={onQuestChoiceVisualPhase}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
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
      {useQuestPopupFallback && popupQuest && popupStep && !(
        popupQuest.id === QUEST_004_B_THE_DOOR_ID &&
        popupStep.id === QUEST_004_B_CARL_HUB_STEP_ID
      ) ? (
        <QuestPopup
          quest={popupQuest}
          step={popupStep}
          playerFlags={playerFlags}
          playerModifiers={playerModifiers}
          showOriginStartHint={showOriginStartHint}
          committedPlayerName={committedPlayerName}
          nameInput={nameInput}
          onNameInputChange={onNameInputChange}
          nameInputError={nameInputError}
          onStepChoice={onStepChoice}
          onNameSubmit={onNameSubmit}
          onAdvanceQuestMessage={onAdvanceQuestMessage}
          onClose={onCloseQuestPopup}
          presentation="modal"
          questTranscript={activeQuestTranscript}
          onQuestChoiceVisualPhase={onQuestChoiceVisualPhase}
        />
      ) : null}
    </section>
  );
}
