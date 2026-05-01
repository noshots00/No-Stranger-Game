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
  return (
    <section className="space-y-6 pb-4">
      <p className="facsimile-kicker">Quests</p>
      <ul className="space-y-0 divide-y divide-[var(--candle-rule)]">
        {visibleQuests.map((quest) => {
          const isExpanded = expandedQuestId === quest.id;
          const isCompleted = completedQuestIds.includes(quest.id);

          return (
            <li key={quest.id} className="py-1">
              <button
                type="button"
                onClick={() => onExpandQuest(isExpanded ? null : quest.id)}
                className={`choice-line ${isCompleted ? 'line-through opacity-70' : ''}`}
              >
                {quest.title}
              </button>
              {isExpanded ? (
                <div className="space-y-3 pb-4 pl-0 pt-2 sm:pl-1">
                  <p className="font-serif text-sm leading-relaxed text-[var(--candle-ink-soft)]">{quest.briefing}</p>
                  <button
                    type="button"
                    onClick={() => onTrackQuest(quest.id)}
                    className="choice-line inline-block py-2 text-[var(--candle-wax)] disabled:opacity-50"
                    disabled={isCompleted}
                  >
                    {isCompleted ? 'Completed' : 'Track quest'}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
