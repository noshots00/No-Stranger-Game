import { useCallback, useEffect, useState } from 'react';
import {
  type DevToolsPanelsConfig,
  type DevToolsRailPanelId,
  readDevToolsPanelsConfig,
  writeDevToolsPanelsConfig,
} from './devToolsPanels';

export function useDevToolsPanels(enabled: boolean) {
  const [config, setConfig] = useState<DevToolsPanelsConfig>(() => readDevToolsPanelsConfig());

  useEffect(() => {
    if (!enabled) return;
    writeDevToolsPanelsConfig(config);
  }, [config, enabled]);

  const setRailsOpen = useCallback((railsOpen: boolean) => {
    setConfig((prev) => ({ ...prev, railsOpen }));
  }, []);

  const setPanelEnabled = useCallback((panelId: DevToolsRailPanelId, enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      panels: { ...prev.panels, [panelId]: enabled },
    }));
  }, []);

  const toggleRailsOpen = useCallback(() => {
    setConfig((prev) => ({ ...prev, railsOpen: !prev.railsOpen }));
  }, []);

  return {
    config,
    railsOpen: config.railsOpen,
    panels: config.panels,
    setRailsOpen,
    setPanelEnabled,
    toggleRailsOpen,
  };
}
