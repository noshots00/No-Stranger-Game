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
    <section className="facsimile-panel space-y-5">
      <p className="facsimile-kicker">Quests</p>
      <div className="space-y-3">
        {visibleQuests.map((quest) => {
          const isExpanded = expandedQuestId === quest.id;
          const isCompleted = completedQuestIds.includes(quest.id);

          return (
            <div key={quest.id} className="rounded-lg border border-[var(--facsimile-panel-border)] bg-[var(--facsimile-panel-soft)]">
              <button
                type="button"
                onClick={() => onExpandQuest(isExpanded ? null : quest.id)}
                className="w-full px-3 py-2 text-left"
              >
                <p className={`text-sm ${isCompleted ? 'line-through opacity-70' : ''}`}>{quest.title}</p>
              </button>
              {isExpanded ? (
                <div className="border-t border-[var(--facsimile-panel-border)] px-3 py-2">
                  <p className="text-xs text-[var(--facsimile-ink-muted)]">{quest.briefing}</p>
                  <button
                    type="button"
                    onClick={() => onTrackQuest(quest.id)}
                    className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--facsimile-ink)]"
                  >
                    {isCompleted ? 'Completed' : 'Track Quest'}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
