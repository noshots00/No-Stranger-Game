import { useState } from 'react';

import { clearPersistedGameState, deleteCharacterState } from '@/services/nostrPersistence';
import { APP_VERSION } from '@/version';

export function VersionBadge() {
  const [open, setOpen] = useState(false);
  const [devToolsEnabled, setDevToolsEnabled] = useState<boolean>(() => localStorage.getItem('nsg_dev_tools') === 'true');
  const isDev = import.meta.env.DEV;

  const handleToggleDevTools = () => {
    const next = !devToolsEnabled;
    setDevToolsEnabled(next);
    localStorage.setItem('nsg_dev_tools', String(next));
  };

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
        <div className="fixed inset-0 z-[130] bg-black/70 p-4">
          <div className="mx-auto mt-12 w-full max-w-md rounded-xl border border-stone-700 bg-stone-900 p-4 shadow-2xl">
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
                  {isDev && (
                    <button
                      type="button"
                      onClick={() => {
                        clearPersistedGameState();
                        window.location.assign('/play');
                      }}
                      className="w-full rounded border border-amber-500/50 bg-amber-900/30 px-3 py-2 text-left text-xs text-amber-200 hover:bg-amber-900/50"
                    >
                      Reset Game State
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3">
                <p className="text-xs font-mono uppercase tracking-wide text-red-300">Character</p>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm('Delete your local character data and restart from intro?');
                    if (!confirmed) return;
                    deleteCharacterState();
                    window.location.assign('/play');
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
