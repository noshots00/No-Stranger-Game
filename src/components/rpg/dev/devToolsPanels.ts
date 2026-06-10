export const DEV_TOOLS_PANELS_STORAGE_KEY = 'nsg:dev-tools-panels';

export type DevToolsRailPanelId =
  | 'questControls'
  | 'timeTools'
  | 'highlights'
  | 'save'
  | 'relay'
  | 'questRail';

export type DevToolsPanelsConfig = {
  railsOpen: boolean;
  panels: Record<DevToolsRailPanelId, boolean>;
};

export const DEV_TOOLS_RAIL_PANEL_IDS: readonly DevToolsRailPanelId[] = [
  'questControls',
  'timeTools',
  'highlights',
  'save',
  'relay',
  'questRail',
];

export const DEV_TOOLS_PANEL_LABELS: Record<DevToolsRailPanelId, string> = {
  questControls: 'Quest restart / test',
  timeTools: 'Time & day roll',
  highlights: 'Name / level styles',
  save: 'Checkpoint restore',
  relay: 'Relay health',
  questRail: 'Quest debug rail',
};

/** Single-letter / short chip labels for the dev toolbar row. */
export const DEV_TOOLS_PANEL_SHORT_LABELS: Record<DevToolsRailPanelId, string> = {
  questControls: 'Q',
  timeTools: 'T',
  highlights: 'Hi',
  save: 'Sv',
  relay: 'Ry',
  questRail: 'Qr',
};

const DEFAULT_PANELS: Record<DevToolsRailPanelId, boolean> = {
  questControls: true,
  timeTools: false,
  highlights: false,
  save: false,
  relay: false,
  questRail: false,
};

export const DEFAULT_DEV_TOOLS_PANELS: DevToolsPanelsConfig = {
  railsOpen: false,
  panels: { ...DEFAULT_PANELS },
};

function isRailPanelId(value: string): value is DevToolsRailPanelId {
  return (DEV_TOOLS_RAIL_PANEL_IDS as readonly string[]).includes(value);
}

export function readDevToolsPanelsConfig(): DevToolsPanelsConfig {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_DEV_TOOLS_PANELS, panels: { ...DEFAULT_PANELS } };
  try {
    const raw = localStorage.getItem(DEV_TOOLS_PANELS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DEV_TOOLS_PANELS, panels: { ...DEFAULT_PANELS } };
    const parsed = JSON.parse(raw) as Partial<DevToolsPanelsConfig>;
    const panels = { ...DEFAULT_PANELS };
    if (parsed.panels && typeof parsed.panels === 'object') {
      for (const [key, value] of Object.entries(parsed.panels)) {
        if (isRailPanelId(key) && typeof value === 'boolean') panels[key] = value;
      }
    }
    return {
      railsOpen: typeof parsed.railsOpen === 'boolean' ? parsed.railsOpen : DEFAULT_DEV_TOOLS_PANELS.railsOpen,
      panels,
    };
  } catch {
    return { ...DEFAULT_DEV_TOOLS_PANELS, panels: { ...DEFAULT_PANELS } };
  }
}

export function writeDevToolsPanelsConfig(config: DevToolsPanelsConfig): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(DEV_TOOLS_PANELS_STORAGE_KEY, JSON.stringify(config));
}
