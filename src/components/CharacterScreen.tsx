import { useMemo, useState } from 'react';

import type { GameState } from '@/types/game';

export default function CharacterScreen({ state }: { state: GameState }) {
  const [showInventory, setShowInventory] = useState(false);

  const visibleStats = useMemo(
    () => [
      ['STR', 10],
      ['DEX', 10],
      ['CON', 10],
      ['INT', 10],
      ['WIS', 10],
      ['CHA', 10],
    ],
    [],
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-950 text-stone-200 overflow-y-auto px-4 py-5 scroll-smooth">
      <header className="flex items-center gap-4 mb-6 pb-4 border-b border-stone-800">
        <div className="relative w-20 h-20 shrink-0 rounded-full border-2 border-amber-700/40 bg-stone-900 overflow-hidden shadow-lg">
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">👤</div>
        </div>
        <div>
          <h1 className="text-2xl font-serif text-amber-50 tracking-wide">{state.tutorial.name || 'Traveler'}</h1>
          <p className="text-sm font-mono text-stone-400 mt-0.5">Level 1 {state.tutorial.race || 'Elf'} Peasant</p>
          <div className="flex gap-3 mt-2 text-xs font-mono text-stone-500">
            <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800">HP {state.character.health}/100</span>
            <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800">{state.character.copperAccumulated}c</span>
            <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800">{state.character.xpAccumulated} XP</span>
          </div>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-3">Ability Scores</h2>
        <div className="grid grid-cols-3 gap-3">
          {visibleStats.map(([stat, value]) => (
            <div key={stat} className="flex flex-col items-center p-3 bg-stone-900/60 border border-stone-800 rounded-lg">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">{stat}</span>
              <span className="text-2xl font-serif text-amber-400 mt-1">{value}</span>
              <span className="text-[10px] text-stone-600 font-mono">+0</span>
            </div>
          ))}
        </div>
      </section>

      {state.character.traits.length > 0 && (
        <div className="p-3 bg-stone-900/40 border border-stone-800 rounded-lg mb-4">
          <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">Discovered Traits</h3>
          <div className="flex flex-wrap gap-2">
            {state.character.traits.map((trait) => (
              <span key={trait} className="px-2.5 py-1 text-xs font-mono rounded border bg-emerald-900/30 text-emerald-400 border-emerald-800/50">
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowInventory((prev) => !prev)}
        className="w-full py-4 mb-4 bg-stone-900 border border-stone-700 hover:bg-stone-800 hover:border-amber-700/50 rounded-lg text-stone-200 font-mono text-sm tracking-wide transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <span className="text-lg">🎒</span>
        {showInventory ? 'Hide Inventory' : 'View Inventory'}
      </button>

      {showInventory && (
        <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-lg mb-4 animate-slideUp">
          <h3 className="text-xs font-mono text-stone-400 mb-3 uppercase tracking-wider">Inventory</h3>
          <div className="grid grid-cols-4 gap-2">
            {[...Array.from({ length: 8 })].map((_, i) => (
              <div key={i} className="aspect-square bg-stone-950 border border-stone-800 rounded flex items-center justify-center text-stone-600 text-xs">
                {i === 0 ? '🗡️' : i === 1 ? '🪵' : ''}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="h-6" />
    </div>
  );
}
