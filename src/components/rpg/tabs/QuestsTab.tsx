import type { JournalLogEntry, QuestDefinition } from '../quests/types';
import { PlayLedgerDisclosure, PlayLedgerKicker } from './PlayLedgerDisclosure';

function latestJournalEntry(questId: string, journalLog: readonly JournalLogEntry[]): JournalLogEntry | undefined {
  let best: JournalLogEntry | undefined;
  for (const e of journalLog) {
    if (e.questId !== questId) continue;
    if (!best || e.atMs >= best.atMs) best = e;
  }
  return best;
}

type QuestsTabProps = {
  visibleQuests: QuestDefinition[];
  completedQuestIds: string[];
  /** Latest recap/rewards come from full journal (may extend beyond Play timeline slice). */
  journalLog: readonly JournalLogEntry[];
  /** Hide Start while this quest is the active Play scene. */
  activeQuestId?: string | null;
  onTrackQuest: (questId: string) => void;
  trackButtonLabel?: string;
  showSectionKicker?: boolean;
  showCompletedSection?: boolean;
};

export function QuestsTab({
  visibleQuests,
  completedQuestIds,
  journalLog,
  activeQuestId = null,
  onTrackQuest,
  trackButtonLabel = 'Track quest',
  showSectionKicker = true,
  showCompletedSection = true,
}: QuestsTabProps) {
  const activeQuests = visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id));
  const completedQuests = visibleQuests.filter((quest) => completedQuestIds.includes(quest.id));

  const renderActiveQuestRow = (quest: QuestDefinition) => {
    const isActiveHere = activeQuestId !== null && activeQuestId === quest.id;
    return (
      <li key={quest.id}>
        <PlayLedgerDisclosure
          summary={<PlayLedgerKicker label="Quest" title={quest.title} />}
        >
          <p className="font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">{quest.briefing}</p>
          {!isActiveHere ? (
            <button
              type="button"
              onClick={() => onTrackQuest(quest.id)}
              className="choice-line inline-block py-2 text-[var(--candle-wax)]"
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
    return (
      <li key={quest.id}>
        <PlayLedgerDisclosure
          summary={<PlayLedgerKicker label="Completed" title={quest.title} mutedTitle />}
        >
          {journalEntry ? (
            <p className="font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">{journalEntry.text}</p>
          ) : (
            <p className="font-serif text-sm italic text-[var(--candle-ink-faint)]">No journal summary recorded.</p>
          )}
          {journalEntry?.completionRewards && journalEntry.completionRewards.length > 0 ? (
            <>
              <p className="font-serif text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
                Rewards
              </p>
              <ul className="list-disc space-y-1 pl-4 font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">
                {journalEntry.completionRewards.map((line, i) => (
                  <li key={`${journalEntry.id}-rw-${i}`}>{line}</li>
                ))}
              </ul>
            </>
          ) : null}
        </PlayLedgerDisclosure>
      </li>
    );
  };

  return (
    <section className={showSectionKicker ? 'space-y-6 pb-4' : 'space-y-3 pb-0'}>
      {showSectionKicker ? <p className="facsimile-kicker">Quests</p> : null}
      <ul className="space-y-0">{activeQuests.map((quest) => renderActiveQuestRow(quest))}</ul>
      {showCompletedSection && completedQuests.length > 0 ? (
        <div className="space-y-1 border-t border-[var(--candle-rule)]/80 pt-2">
          <p className="font-serif text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
            Completed quests
          </p>
          <ul className="space-y-0">{completedQuests.map((quest) => renderCompletedQuestRow(quest))}</ul>
        </div>
      ) : null}
    </section>
  );
}
