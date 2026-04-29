import { useMemo, useState } from 'react';

import type { GameState } from '@/types/game';
import TavernBounties from '@/components/TavernBounties';

interface CharacterScreenProps {
  state: GameState;
  completedQuestIds: string[];
  onApplyModifiers: (mods: Record<string, number>) => void;
  onCompleteQuest: (questId: string) => void;
  estMidnightTimestamp: number;
}

export default function CharacterScreen({ state, completedQuestIds, onApplyModifiers, onCompleteQuest, estMidnightTimestamp }: CharacterScreenProps) {
  const [showInventory, setShowInventory] = useState(false);
  const [showBounties, setShowBounties] = useState(false);

  const visibleStats = useMemo(
    (): Array<[string, number]> => [
      ['STR', 10 + (state.character.modifiers.strength ?? 0)],
      ['DEX', 10 + (state.character.modifiers.agility ?? 0)],
      ['CON', 10 + (state.character.modifiers.survival ?? 0)],
      ['INT', 10 + (state.character.modifiers.arcane ?? 0)],
      ['WIS', 10 + (state.character.modifiers.wisdom ?? 0)],
      ['CHA', 10 + (state.character.modifiers.liked ?? 0)],
    ],
    [state.character.modifiers],
  );

  if (showBounties) {
    return (
      <div className="flex flex-col h-full">
        <button
          onClick={() => setShowBounties(false)}
          className="px-4 py-2 text-xs font-mono text-stone-400 hover:text-stone-200 text-left border-b border-stone-800 bg-stone-950 shrink-0"
        >
          &larr; Back to Character
        </button>
        <div className="flex-1 overflow-hidden">
          <TavernBounties
            currentDay={state.character.day}
            completedQuestIds={completedQuestIds}
            onApplyModifiers={onApplyModifiers}
            onCompleteQuest={onCompleteQuest}
            estMidnightTimestamp={estMidnightTimestamp}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-950 text-stone-200 overflow-y-auto px-4 py-5 scroll-smooth">
      <header className="flex items-center gap-4 mb-6 pb-4 border-b border-stone-800">
        <div className="relative w-20 h-20 shrink-0 rounded-full border-2 border-amber-700/40 bg-stone-900 overflow-hidden shadow-lg">
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">👤</div>
        </div>
        <div>
          <h1 className="text-2xl font-serif text-amber-50 tracking-wide">{state.tutorial.name || 'Traveler'}</h1>
          <p className="text-sm font-mono text-stone-400 mt-0.5">Level {Math.max(1, Math.floor(state.character.xpAccumulated / 100) + 1)} {state.tutorial.race || 'Elf'} {state.character.profession}</p>
          <div className="flex gap-3 mt-2 text-xs font-mono text-stone-500">
            <span className="bg-stone-900 px-2 py-0.5 rounded border border-stone-800">HP {state.character.health}/{state.character.maxHealth}</span>
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
              <span className="text-[10px] text-stone-600 font-mono">{value >= 10 ? '+' : ''}{value - 10}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 p-3 bg-stone-900/40 border border-stone-800 rounded-lg">
        <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">Field Notes</h3>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono text-stone-300">
          <div className="rounded border border-stone-800 bg-stone-950/60 px-2 py-1">Day {state.character.day}</div>
          <div className="rounded border border-stone-800 bg-stone-950/60 px-2 py-1">{state.character.region}</div>
          <div className="rounded border border-stone-800 bg-stone-950/60 px-2 py-1">{state.character.shelter}</div>
        </div>
      </section>

      <section className="mb-4 p-3 bg-stone-900/40 border border-stone-800 rounded-lg">
        <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-2">Known Locations</h3>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded border border-stone-700 bg-stone-950/60 text-stone-300">Forest</span>
          {state.unlocks.map && <span className="px-2 py-1 rounded border border-stone-700 bg-stone-950/60 text-stone-300">Village</span>}
          {state.unlocks.tavern && <span className="px-2 py-1 rounded border border-stone-700 bg-stone-950/60 text-stone-300">Tavern</span>}
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
              <div key={i} className="aspect-square bg-stone-950 border border-stone-800 rounded flex items-center justify-center text-stone-400 text-xs text-center px-1">
                {state.character.inventory[i] ?? ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {state.unlocks.quests && (
        <button
          onClick={() => setShowBounties(true)}
          className="w-full py-4 mb-4 bg-amber-900/30 border border-amber-700/50 hover:bg-amber-900/50 rounded-lg text-amber-200 font-mono text-sm tracking-wide transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span className="text-lg">📜</span>
          Bounty Board
        </button>
      )}

      <div className="h-6" />
    </div>
  );
}
