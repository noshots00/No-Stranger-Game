import type { JournalLogEntry, QuestDefinition } from '../quests/types';
import { PlayLedgerDisclosure, PlayLedgerKicker } from './PlayLedgerDisclosure';
import { getQuestCardImageSrc } from '../rpgArtAssignments';

function latestJournalEntry(questId: string, journalLog: readonly JournalLogEntry[]): JournalLogEntry | undefined {
  let best: JournalLogEntry | undefined;
  for (const e of journalLog) {
    if (e.questId !== questId) continue;
    if (!best || e.atMs >= best.atMs) best = e;
  }
  return best;
}

function summaryToNumberedLines(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) return [];
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

type QuestsTabProps = {
  visibleQuests: QuestDefinition[];
  completedQuestIds: string[];
  /** Quest ids that should show the NEW marker. */
  newQuestIds?: readonly string[];
  /** Latest recap/rewards come from full journal (may extend beyond Play timeline slice). */
  journalLog: readonly JournalLogEntry[];
  /** Hide Start while this quest is the active Play scene. */
  activeQuestId?: string | null;
  onTrackQuest: (questId: string) => void;
  onAcknowledgeQuest?: (questId: string) => void;
  trackButtonLabel?: string;
  showSectionKicker?: boolean;
  showCompletedSection?: boolean;
};

export function QuestsTab({
  visibleQuests,
  completedQuestIds,
  newQuestIds = [],
  journalLog,
  activeQuestId = null,
  onTrackQuest,
  onAcknowledgeQuest,
  trackButtonLabel = 'Track quest',
  showSectionKicker = true,
  showCompletedSection = true,
}: QuestsTabProps) {
  const newQuestIdSet = new Set(newQuestIds);
  const activeQuests = visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id));
  const completedQuests = visibleQuests.filter((quest) => completedQuestIds.includes(quest.id));

  const renderActiveQuestRow = (quest: QuestDefinition) => {
    const isActiveHere = activeQuestId !== null && activeQuestId === quest.id;
    const isNewQuest = newQuestIdSet.has(quest.id);
    return (
      <li key={quest.id}>
        <PlayLedgerDisclosure
          summary={
            <div
              className="flex items-start justify-between gap-2"
              onClick={() => {
                if (isNewQuest) onAcknowledgeQuest?.(quest.id);
              }}
            >
              <PlayLedgerKicker label="Quest" title={quest.title} titleClassName="text-[var(--candle-flame-soft)]" />
              {isNewQuest ? (
                <span className="mt-0.5 rounded border border-[var(--candle-flame-soft)]/45 bg-[var(--candle-flame-soft)]/10 px-1.5 py-0.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-[var(--candle-wax)]">
                  New
                </span>
              ) : null}
            </div>
          }
        >
          <img
            src={getQuestCardImageSrc(quest)}
            alt={`${quest.title} illustration`}
            className="mx-auto mb-1 aspect-[3/4] w-full max-w-[170px] rounded-md border border-[var(--candle-rule)] object-cover"
            loading="lazy"
          />
          <p className="font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">{quest.briefing}</p>
          {!isActiveHere ? (
            <button
              type="button"
              onClick={() => onTrackQuest(quest.id)}
              className="choice-line ml-3 inline-block py-2 text-sky-300 hover:text-sky-200"
            >
              {trackButtonLabel}
            </button>
          ) : null}
        </PlayLedgerDisclosure>
      </li>
    );
  };

  const renderCompletedQuestRow = (quest: QuestDefinition) => {
    const journalEntry = latestJournalEntry(quest.id, journalLog);
    const summaryLines = journalEntry ? summaryToNumberedLines(journalEntry.text) : [];
    return (
      <li key={quest.id}>
        <PlayLedgerDisclosure
          summary={
            <PlayLedgerKicker
              title={quest.title}
              mutedTitle
              titleClassName="text-[0.8125rem] text-[var(--candle-flame-soft)]"
            />
          }
        >
          <div className="mb-2 flex items-center gap-3">
            <img
              src={getQuestCardImageSrc(quest)}
              alt={`${quest.title} illustration`}
              className="h-[200px] w-[266px] rounded-md border border-[var(--candle-rule)] object-cover opacity-90"
              loading="lazy"
            />
            <p className="font-serif text-base text-[var(--candle-flame-soft)]">{quest.title}</p>
          </div>
          {journalEntry ? (
            summaryLines.length > 0 ? (
              <ol className="list-decimal space-y-1 pl-5 font-serif text-[0.8125rem] leading-relaxed text-[var(--candle-ink-soft)]">
                {summaryLines.map((line, i) => (
                  <li key={`${journalEntry.id}-line-${i}`}>{line}</li>
                ))}
              </ol>
            ) : (
              <p className="font-serif text-[0.8125rem] italic text-[var(--candle-ink-faint)]">No journal summary recorded.</p>
            )
          ) : (
            <p className="font-serif text-[0.8125rem] italic text-[var(--candle-ink-faint)]">No journal summary recorded.</p>
          )}
        </PlayLedgerDisclosure>
      </li>
    );
  };

  return (
    <section className={showSectionKicker ? 'space-y-6 pb-4' : 'space-y-3 pb-0'}>
      {showSectionKicker ? <p className="facsimile-kicker">Quests</p> : null}
      {showCompletedSection && completedQuests.length > 0 ? (
        <div className="space-y-1 border-t border-[var(--candle-rule)]/80 pt-2">
          <ul className="space-y-0">{completedQuests.map((quest) => renderCompletedQuestRow(quest))}</ul>
        </div>
      ) : null}
      <ul className="space-y-0">{activeQuests.map((quest) => renderActiveQuestRow(quest))}</ul>
    </section>
  );
}
