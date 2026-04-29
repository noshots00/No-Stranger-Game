import { useEffect, useState } from 'react';

import { clearPersistedGameState, deleteCharacterState } from '@/services/nostrPersistence';
import { APP_VERSION } from '@/version';

export function VersionBadge() {
  const [open, setOpen] = useState(false);
  const [devToolsEnabled, setDevToolsEnabled] = useState<boolean>(() => localStorage.getItem('nsg_dev_tools') === 'true');
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const isDev = import.meta.env.DEV;

  const handleToggleDevTools = () => {
    const next = !devToolsEnabled;
    setDevToolsEnabled(next);
    localStorage.setItem('nsg_dev_tools', String(next));
  };

  // Show saved game state in dev panel
  const [savedState, setSavedState] = useState<string>('');
  useEffect(() => {
    if (!devPanelOpen) return;
    try {
      const raw = localStorage.getItem('nsg_game_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedState(JSON.stringify(parsed, null, 2));
      } else {
        setSavedState('No saved state found');
      }
    } catch {
      setSavedState('Error reading state');
    }
  }, [devPanelOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-2 right-2 z-[120] rounded border border-stone-600 bg-stone-900/90 px-2 py-1 text-[10px] font-mono tracking-wide text-stone-200 hover:bg-stone-800"
        aria-label="Open game settings"
      >
        {APP_VERSION}
      </button>

      {open && (
        <div className="fixed inset-0 z-[130] bg-black/70 p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="mx-auto mt-12 w-full max-w-md rounded-xl border border-stone-700 bg-stone-900 p-4 shadow-2xl max-h-[80dvh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-stone-100">Game Settings</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded border border-stone-700 px-2 py-1 text-xs text-stone-300 hover:bg-stone-800">
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-stone-700 bg-stone-800/60 p-3">
                <p className="text-xs font-mono uppercase tracking-wide text-stone-400">Version</p>
                <p className="mt-1 text-sm text-stone-100">{APP_VERSION}</p>
              </div>

              <div className="rounded-lg border border-stone-700 bg-stone-800/60 p-3">
                <p className="text-xs font-mono uppercase tracking-wide text-stone-400">Dev Tools</p>
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleToggleDevTools}
                    className="w-full rounded border border-stone-600 bg-stone-700 px-3 py-2 text-left text-xs text-stone-100 hover:bg-stone-600"
                  >
                    {devToolsEnabled ? 'Disable' : 'Enable'} Dev Tools Flag
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevPanelOpen(!devPanelOpen)}
                    className="w-full rounded border border-stone-600 bg-stone-700 px-3 py-2 text-left text-xs text-stone-100 hover:bg-stone-600"
                  >
                    {devPanelOpen ? 'Hide' : 'Show'} Debug Panel
                  </button>
                  {isDev && (
                    <button
                      type="button"
                      onClick={() => {
                        clearPersistedGameState();
                        window.location.assign('/');
                      }}
                      className="w-full rounded border border-amber-500/50 bg-amber-900/30 px-3 py-2 text-left text-xs text-amber-200 hover:bg-amber-900/50"
                    >
                      Reset Game State
                    </button>
                  )}
                </div>
              </div>

              {devPanelOpen && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-3 animate-fadeIn">
                  <p className="text-xs font-mono uppercase tracking-wide text-blue-300 mb-2">Debug Panel</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-mono text-stone-400 mb-1">Saved Game State:</p>
                      <pre className="text-[9px] font-mono text-stone-300 bg-stone-950 rounded p-2 max-h-[200px] overflow-y-auto whitespace-pre-wrap break-all border border-stone-800">
                        {savedState}
                      </pre>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const raw = localStorage.getItem('nsg_game_state');
                          if (raw) {
                            const parsed = JSON.parse(raw);
                            setSavedState(JSON.stringify(parsed, null, 2));
                          }
                        } catch { /* ignore */ }
                      }}
                      className="w-full rounded border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs text-blue-200 hover:bg-blue-900/40"
                    >
                      Refresh State
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const step = prompt('Jump to step (e.g. intro_1, idle_play, deckard_lore_1):');
                        if (!step) return;
                        try {
                          const raw = localStorage.getItem('nsg_game_state');
                          if (raw) {
                            const state = JSON.parse(raw);
                            state.tutorial.step = step;
                            localStorage.setItem('nsg_game_state', JSON.stringify(state));
                            window.location.reload();
                          }
                        } catch { /* ignore */ }
                      }}
                      className="w-full rounded border border-blue-500/40 bg-blue-950/40 px-3 py-1.5 text-xs text-blue-200 hover:bg-blue-900/40"
                    >
                      Jump to Step
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3">
                <p className="text-xs font-mono uppercase tracking-wide text-red-300">Character</p>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm('Delete your local character data and restart from intro?');
                    if (!confirmed) return;
                    deleteCharacterState();
                    window.location.assign('/');
                  }}
                  className="mt-2 w-full rounded border border-red-500/60 bg-red-950/60 px-3 py-2 text-left text-xs text-red-100 hover:bg-red-900/70"
                >
                  Delete Character
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
