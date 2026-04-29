import { useState } from 'react';

import { audioManager } from '@/services/audioManager';

export function AudioInitializer({ onReady }: { onReady: () => void }) {
  const [visible, setVisible] = useState(true);

  const enable = () => {
    void audioManager.init().then(() => {
      setVisible(false);
      onReady();
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
      <div className="bg-stone-900 border border-amber-800/40 rounded-xl p-6 max-w-sm text-center shadow-2xl">
        <h3 className="text-lg font-serif text-amber-50 mb-2">Enter the Clearing</h3>
        <p className="text-sm text-stone-400 mb-4">Tap anywhere to awaken ambient sounds and UI chimes.</p>
        <button
          onClick={enable}
          className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded-lg transition-colors active:scale-[0.98]"
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
}
