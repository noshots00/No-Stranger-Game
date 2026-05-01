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
      <li key={quest.id} className={compact ? 'py-1 pl-4 sm:pl-6' : 'py-1'}>
        <button
          type="button"
          onClick={() => onExpandQuest(isExpanded ? null : quest.id)}
          className={`choice-line ${isCompleted ? 'line-through opacity-70' : ''} ${compact ? 'text-sm' : ''}`}
        >
          {quest.title}
        </button>
        {isExpanded ? (
          <div className={`space-y-3 pb-4 pt-2 ${compact ? 'pl-2 sm:pl-3' : 'pl-0 sm:pl-1'}`}>
            <p className={`font-serif leading-relaxed text-[var(--candle-ink-soft)] ${compact ? 'text-xs' : 'text-sm'}`}>
              {quest.briefing}
            </p>
            <button
              type="button"
              onClick={() => onTrackQuest(quest.id)}
              className={`choice-line inline-block py-2 text-[var(--candle-wax)] disabled:opacity-50 ${compact ? 'text-sm' : ''}`}
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
        <div className="space-y-2 border-t border-[var(--candle-rule)] pt-3">
          <p className="font-serif text-xs uppercase tracking-[0.1em] text-[var(--candle-ink-soft)]">Completed quests</p>
          <ul className="space-y-0 divide-y divide-[var(--candle-rule)]">
            {completedQuests.map((quest) => renderQuestRow(quest, true))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
