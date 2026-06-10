import { cn } from '@/lib/utils';
import {
  DEV_TOOLS_PANEL_LABELS,
  DEV_TOOLS_PANEL_SHORT_LABELS,
  DEV_TOOLS_RAIL_PANEL_IDS,
  type DevToolsRailPanelId,
} from './devToolsPanels';

type DevToolsControlPanelProps = {
  railsOpen: boolean;
  onRailsOpenChange: (open: boolean) => void;
  panels: Record<DevToolsRailPanelId, boolean>;
  onPanelChange: (panelId: DevToolsRailPanelId, enabled: boolean) => void;
  showQuestChoiceModifiers: boolean;
  onShowQuestChoiceModifiersChange: (enabled: boolean) => void;
  showQuestChoiceEffects: boolean;
  onShowQuestChoiceEffectsChange: (enabled: boolean) => void;
};

type DevToolChipProps = {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
};

function DevToolChip({ label, title, active, onClick }: DevToolChipProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-w-[1.35rem] rounded border px-1 py-0.5 font-mono text-[0.58rem] leading-none tracking-tight shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-colors',
        active
          ? 'border-[var(--candle-flame-soft)]/55 bg-[var(--candle-flame)]/25 text-[var(--candle-wax)]'
          : 'border-[var(--candle-rule)]/55 bg-black/75 text-[var(--candle-ink-faint)] hover:border-[var(--candle-rule)] hover:text-[var(--candle-ink-soft)]'
      )}
    >
      {label}
    </button>
  );
}

/** Chip row for the dev left rail — one toggle per tool. */
export function DevToolsControlPanel({
  railsOpen,
  onRailsOpenChange,
  panels,
  onPanelChange,
  showQuestChoiceModifiers,
  onShowQuestChoiceModifiersChange,
  showQuestChoiceEffects,
  onShowQuestChoiceEffectsChange,
}: DevToolsControlPanelProps) {
  return (
    <div
      className="flex max-w-full flex-wrap items-center gap-0.5"
      role="toolbar"
      aria-label="Developer tools"
    >
      <DevToolChip
        label="▥"
        title="Side rails"
        active={railsOpen}
        onClick={() => onRailsOpenChange(!railsOpen)}
      />
      {DEV_TOOLS_RAIL_PANEL_IDS.map((id) => (
        <DevToolChip
          key={id}
          label={DEV_TOOLS_PANEL_SHORT_LABELS[id]}
          title={DEV_TOOLS_PANEL_LABELS[id]}
          active={panels[id]}
          onClick={() => onPanelChange(id, !panels[id])}
        />
      ))}
      <span className="mx-0.5 h-3 w-px shrink-0 bg-[var(--candle-rule)]/50" aria-hidden />
      <DevToolChip
        label="Mod"
        title="Choice modifiers & items"
        active={showQuestChoiceModifiers}
        onClick={() => onShowQuestChoiceModifiersChange(!showQuestChoiceModifiers)}
      />
      <DevToolChip
        label="Flg"
        title="Choice flags & routing"
        active={showQuestChoiceEffects}
        onClick={() => onShowQuestChoiceEffectsChange(!showQuestChoiceEffects)}
      />
    </div>
  );
}
