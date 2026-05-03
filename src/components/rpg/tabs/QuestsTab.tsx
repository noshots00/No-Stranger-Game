import type { QuestDefinition } from '../quests/types';

type QuestsTabProps = {
  visibleQuests: QuestDefinition[];
  completedQuestIds: string[];
  expandedQuestId: string | null;
  onExpandQuest: (id: string | null) => void;
  onTrackQuest: (questId: string) => void;
};

export function QuestsTab({
  visibleQuests,
  completedQuestIds,
  expandedQuestId,
  onExpandQuest,
  onTrackQuest,
}: QuestsTabProps) {
  const activeQuests = visibleQuests.filter((quest) => !completedQuestIds.includes(quest.id));
  const completedQuests = visibleQuests.filter((quest) => completedQuestIds.includes(quest.id));

  const renderQuestRow = (quest: QuestDefinition, compact = false) => {
    const isExpanded = expandedQuestId === quest.id;
    const isCompleted = completedQuestIds.includes(quest.id);

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
            className={`space-y-2 pb-3 pt-1 ${compact ? 'pl-0 text-right sm:pl-2' : 'pl-0 sm:pl-1'}`}
          >
            <p
              className={`font-serif leading-snug text-[var(--candle-ink-soft)] ${compact ? 'text-[11px]' : 'text-sm leading-relaxed'}`}
            >
              {quest.briefing}
            </p>
            <button
              type="button"
              onClick={() => onTrackQuest(quest.id)}
              className={
                compact
                  ? 'choice-line !inline-block !w-auto !py-1 !text-xs text-[var(--candle-wax)] disabled:opacity-50'
                  : 'choice-line inline-block py-2 text-[var(--candle-wax)] disabled:opacity-50'
              }
              disabled={isCompleted}
            >
              {isCompleted ? 'Completed' : 'Track quest'}
            </button>
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <section className="space-y-6 pb-4">
      <p className="facsimile-kicker">Quests</p>
      <ul className="space-y-0 divide-y divide-[var(--candle-rule)]">{activeQuests.map((quest) => renderQuestRow(quest))}</ul>
      {completedQuests.length > 0 ? (
        <div className="ml-auto max-w-[min(100%,20rem)] space-y-1 border-t border-[var(--candle-rule)]/80 pt-2 sm:max-w-none">
          <p className="font-serif text-[10px] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)] sm:text-right">
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
