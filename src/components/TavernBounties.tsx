import { useEffect, useMemo, useState } from 'react';

import { getCountdownToMidnight } from '@/utils/time';

export interface QuestChoice {
  id: string;
  text: string;
  modifiers: Record<string, number>;
  flavor: string;
}

export interface Quest {
  id: string;
  title: string;
  npc: string;
  description: string;
  choices: QuestChoice[];
  dayUnlocked: number;
  rewardFlavor: string;
}

interface TavernBountiesProps {
  currentDay: number;
  completedQuestIds: string[];
  onApplyModifiers: (mods: Record<string, number>) => void;
  onCompleteQuest: (questId: string) => void;
  estMidnightTimestamp: number;
}

const QUEST_POOL: Quest[] = [
  {
    id: 'q1',
    title: 'The Lost Ledger',
    npc: 'Old Markus',
    dayUnlocked: 1,
    description: "Markus's ledger vanished from the inn counter. He needs it back before the tally falls behind.",
    rewardFlavor: 'Polite +, Trusted +',
    choices: [
      { id: 'c1', text: 'Return it', modifiers: { honest: 2, polite: 1 }, flavor: 'You hand it over carefully.' },
      { id: 'c2', text: 'Keep it', modifiers: { greedy: 2, secretive: 1 }, flavor: 'It disappears into your coat.' },
      { id: 'c3', text: 'Burn it', modifiers: { reckless: 2, chaotic: 1 }, flavor: 'The pages curl in the hearth.' },
    ],
  },
  {
    id: 'q2',
    title: 'The Stolen Hammer',
    npc: 'Grendel',
    dayUnlocked: 2,
    description: "Grendel's forging hammer is gone. He suspects a rival smith, but has no proof.",
    rewardFlavor: 'Observant +, Strong +',
    choices: [
      { id: 'c4', text: 'Investigate quietly', modifiers: { cunning: 2, stealth: 1 }, flavor: 'You follow the rust trails.' },
      { id: 'c5', text: 'Confront the rival', modifiers: { brave: 2, aggressive: 1 }, flavor: 'Words turn to steel.' },
      { id: 'c6', text: 'Ignore it', modifiers: { passive: 1, detached: 1 }, flavor: 'Some fires burn out on their own.' },
    ],
  },
];

export default function TavernBounties({
  currentDay,
  completedQuestIds,
  onApplyModifiers,
  onCompleteQuest,
  estMidnightTimestamp,
}: TavernBountiesProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('00:00:00');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const available = useMemo(() => {
    const uncompleted = QUEST_POOL.filter((q) => !completedQuestIds.includes(q.id));
    return uncompleted.find((q) => q.dayUnlocked <= currentDay) ?? null;
  }, [completedQuestIds, currentDay]);

  const completed = useMemo(() => QUEST_POOL.filter((q) => completedQuestIds.includes(q.id)), [completedQuestIds]);

  useEffect(() => {
    const tick = () => setCountdown(getCountdownToMidnight(estMidnightTimestamp));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [estMidnightTimestamp]);

  const handleChoice = (quest: Quest, choice: QuestChoice) => {
    onApplyModifiers(choice.modifiers);
    setActiveId(choice.id);
    setTimeout(() => {
      onCompleteQuest(quest.id);
      setExpandedId(null);
      setActiveId(null);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-950 text-stone-200 overflow-y-auto px-4 py-5 scroll-smooth">
      <header className="mb-6 pb-3 border-b border-stone-800">
        <h1 className="text-xl font-serif text-amber-50 tracking-wide">Tavern Bounties</h1>
        <p className="text-xs text-stone-500 font-mono mt-1">
          {available ? 'One task per day. Choose wisely.' : `Next bounty unlocks in ${countdown}`}
        </p>
      </header>

      {available ? (
        <div className="mb-6">
          <div
            onClick={() => setExpandedId(expandedId === available.id ? null : available.id)}
            className="p-4 bg-stone-900/60 border border-amber-800/40 rounded-lg cursor-pointer hover:bg-stone-900/80 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-serif text-amber-400">{available.title}</h2>
                <p className="text-xs font-mono text-stone-500 mt-0.5">Posted by {available.npc}</p>
              </div>
              <span className="text-xs font-mono text-emerald-500 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800/40">Active</span>
            </div>
            {expandedId === available.id && (
              <div className="mt-4 pt-4 border-t border-stone-800 animate-fadeIn">
                <p className="text-sm text-stone-300 leading-relaxed mb-4 italic">"{available.description}"</p>
                <div className="space-y-3">
                  {available.choices.map((choice) => (
                    <button
                      key={choice.id}
                      disabled={Boolean(activeId)}
                      onClick={() => handleChoice(available, choice)}
                      className={`w-full text-left p-3 rounded border transition-all ${
                        activeId === choice.id
                          ? 'bg-amber-900/30 border-amber-600 text-amber-200 scale-[0.98]'
                          : 'bg-stone-950/50 border-stone-700 hover:border-stone-600 text-stone-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{choice.text}</span>
                        {activeId === choice.id && <span className="text-xs animate-pulse">✦</span>}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1 font-mono">{choice.flavor}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-600 mt-3 font-mono text-center">Reward: {available.rewardFlavor}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-stone-900/20 border border-dashed border-stone-800 rounded-lg text-center">
          <p className="text-sm text-stone-400 italic">The board is empty for now.</p>
          <p className="text-xs text-stone-600 mt-2 font-mono">Check back after the midnight bell.</p>
        </div>
      )}

      {completed.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-800">
          <h3 className="text-[10px] uppercase tracking-widest text-stone-500 font-mono mb-3">Completed</h3>
          <div className="space-y-2">
            {completed.map((quest) => (
              <div key={quest.id} className="p-3 bg-stone-900/30 border border-stone-800 rounded flex items-center gap-3 opacity-70">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <div>
                  <p className="text-sm font-serif text-stone-400">{quest.title}</p>
                  <p className="text-[10px] text-stone-600 font-mono">Resolved on Day {quest.dayUnlocked}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}
