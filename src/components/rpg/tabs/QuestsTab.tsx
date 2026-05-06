import type { QuestDefinition } from '../quests/types';

type QuestsTabProps = {
  visibleQuests: QuestDefinition[];
  completedQuestIds: string[];
  /** Quest currently running on Play — hides Start / Track for that row. */
  activeQuestId?: string | null;
  expandedQuestId: string | null;
  onExpandQuest: (id: string | null) => void;
  onTrackQuest: (questId: string) => void;
  /** Primary nav uses “Track quest”; journal / Chronicle may prefer “Start quest”. */
  trackButtonLabel?: string;
  /** When false, omit the “Quests” kicker (Play embed is headerless). */
  showSectionKicker?: boolean;
  /** When false, omit the completed-quests block (Quest nav tab only). */
  showCompletedSection?: boolean;
};

export function QuestsTab({
  visibleQuests,
  completedQuestIds,
  activeQuestId = null,
  expandedQuestId,
  onExpandQuest,
  onTrackQuest,
  trackButtonLabel = 'Track quest',
  showSectionKicker = true,
  showCompletedSection = true,
}: QuestsTabProps) {
  const activeQuests = visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id));
  const completedQuests = visibleQuests.filter((quest) => completedQuestIds.includes(quest.id));

  const renderQuestRow = (quest: QuestDefinition, compact = false) => {
    const isExpanded = expandedQuestId === quest.id;
    const isCompleted = completedQuestIds.includes(quest.id);
    const isActiveHere = activeQuestId !== null && activeQuestId === quest.id;

    return (
      <li
        key={quest.id}
        className={compact ? 'py-0.5 text-right' : 'py-1'}
      >
        <button
          type="button"
          onClick={() => onExpandQuest(isExpanded ? null : quest.id)}
          className={
            compact
              ? `choice-line !py-1 !text-xs !leading-snug !text-right ${isCompleted ? 'line-through opacity-65' : ''}`
              : `choice-line ${isCompleted ? 'line-through opacity-70' : ''}`
          }
        >
          {quest.title}
        </button>
        {isExpanded ? (
          <div
            className={`space-y-2 pb-3 pt-1 ${compact ? 'pl-0 text-right' : 'pl-0'}`}
          >
            <p
              className={`font-serif leading-snug text-[var(--candle-ink-soft)] ${compact ? 'text-[0.6875rem]' : 'text-sm leading-relaxed'}`}
            >
              {quest.briefing}
            </p>
            {isCompleted ? (
              <button
                type="button"
                disabled
                className={
                  compact
                    ? 'choice-line !inline-block !w-auto !py-1 !text-xs text-[var(--candle-wax)] disabled:opacity-50'
                    : 'choice-line inline-block py-2 text-[var(--candle-wax)] disabled:opacity-50'
                }
              >
                Completed
              </button>
            ) : isActiveHere ? null : (
              <button
                type="button"
                onClick={() => onTrackQuest(quest.id)}
                className={
                  compact
                    ? 'choice-line !inline-block !w-auto !py-1 !text-xs text-[var(--candle-wax)] disabled:opacity-50'
                    : 'choice-line inline-block py-2 text-[var(--candle-wax)] disabled:opacity-50'
                }
              >
                {trackButtonLabel}
              </button>
            )}
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <section className={showSectionKicker ? 'space-y-6 pb-4' : 'space-y-3 pb-0'}>
      {showSectionKicker ? <p className="facsimile-kicker">Quests</p> : null}
      <ul className="space-y-0 divide-y divide-[var(--candle-rule)]">{activeQuests.map((quest) => renderQuestRow(quest))}</ul>
      {showCompletedSection && completedQuests.length > 0 ? (
        <div className="ml-auto max-w-[min(100%,20rem)] space-y-1 border-t border-[var(--candle-rule)]/80 pt-2">
          <p className="text-right font-serif text-[0.625rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">
            Completed quests
          </p>
          <ul className="space-y-0 divide-y divide-[var(--candle-rule)]/70 text-right">
            {completedQuests.map((quest) => renderQuestRow(quest, true))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
