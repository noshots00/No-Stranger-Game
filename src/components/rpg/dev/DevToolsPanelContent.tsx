import type { QuestDefinition } from '../quests/types';
import { CharacterHighlightPreview } from './CharacterHighlightPreview';
import { DevCollapsibleSection } from './DevCollapsibleSection';
import { DevTimeToolsPanel } from './DevTimeToolsPanel';
import type { DevToolsRailPanelId } from './devToolsPanels';

type DevToolsPanelContentProps = {
  panels: Record<DevToolsRailPanelId, boolean>;
  compact?: boolean;
  dayCounter: number;
  onAdvanceDay: () => void;
  devQuestSelection: string;
  onDevQuestSelectionChange: (questId: string) => void;
  orderedQuestsForDev: readonly QuestDefinition[];
  completedQuestIds: readonly string[];
  onDevRestartFromQuest: (questId: string) => void;
  onDevTestQuest: (questId: string) => void;
  onOpenCheckpointRestore: () => void;
};

/** Shared dev tool sections for left rail and mobile header flyout. */
export function DevToolsPanelContent({
  panels,
  compact = false,
  dayCounter,
  onAdvanceDay,
  devQuestSelection,
  onDevQuestSelectionChange,
  orderedQuestsForDev,
  completedQuestIds,
  onDevRestartFromQuest,
  onDevTestQuest,
  onOpenCheckpointRestore,
}: DevToolsPanelContentProps) {
  const sectionGap = compact ? 'space-y-1' : 'space-y-1.5';

  return (
    <div className={`flex flex-col font-serif text-xs text-[var(--candle-ink)] ${sectionGap}`}>
      {panels.questControls ? (
        <DevCollapsibleSection title="Quest" defaultOpen>
          <select
            className="max-w-full rounded border border-[var(--candle-rule)] bg-black/30 px-1.5 py-0.5 text-[0.65rem] text-[var(--candle-ink)]"
            value={devQuestSelection}
            onChange={(e) => onDevQuestSelectionChange(e.target.value)}
          >
            {orderedQuestsForDev.map((q) => (
              <option
                key={q.id}
                value={q.id}
                style={{ color: completedQuestIds.includes(q.id) ? '#111111' : '#8b8b8b' }}
              >
                {q.title}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              className="rounded border border-amber-500/50 bg-amber-500/15 px-1.5 py-1 text-[0.65rem] font-medium text-[var(--candle-ink)] hover:bg-amber-500/25"
              onClick={() => onDevRestartFromQuest(devQuestSelection)}
              disabled={!devQuestSelection}
            >
              Restart
            </button>
            <button
              type="button"
              className="rounded border border-[var(--candle-wax)]/40 bg-[var(--candle-flame)]/20 px-1.5 py-1 text-[0.65rem] font-medium text-[var(--candle-ink)] hover:bg-[var(--candle-flame)]/30"
              onClick={() => onDevTestQuest(devQuestSelection)}
              disabled={!devQuestSelection}
            >
              Test
            </button>
          </div>
        </DevCollapsibleSection>
      ) : null}

      {panels.timeTools ? (
        <DevCollapsibleSection title="Time">
          <DevTimeToolsPanel dayCounter={dayCounter} onAdvanceDay={onAdvanceDay} compact />
        </DevCollapsibleSection>
      ) : null}

      {panels.save ? (
        <DevCollapsibleSection title="Save">
          <button
            type="button"
            className="w-full rounded border border-[var(--candle-rule)]/70 bg-black/25 px-1.5 py-1 text-left text-[0.65rem] text-[var(--candle-ink-soft)] hover:bg-black/40 hover:text-[var(--candle-wax)]"
            onClick={onOpenCheckpointRestore}
          >
            Restore kind 10032…
          </button>
        </DevCollapsibleSection>
      ) : null}

      {panels.highlights ? (
        <DevCollapsibleSection title="Highlights">
          <CharacterHighlightPreview compact />
        </DevCollapsibleSection>
      ) : null}
    </div>
  );
}
