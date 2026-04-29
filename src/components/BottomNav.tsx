import { useEffect, useRef } from 'react';

import type { TabId } from '@/types/game';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  unlocks: { map: boolean; character: boolean };
}

export default function BottomNav({ activeTab, onTabChange, unlocks }: BottomNavProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateSafeArea = () => {
      if (!navRef.current) return;
      const safeBottom = window.innerHeight - document.documentElement.clientHeight;
      navRef.current.style.paddingBottom = `${Math.max(12, safeBottom)}px`;
    };
    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  const tabs: Array<{ id: TabId; icon: string; label: string; unlocked: boolean }> = [
    { id: 'play', icon: '▶️', label: 'Play', unlocked: true },
    { id: 'map', icon: '🗺️', label: 'Map', unlocked: unlocks.map },
    { id: 'character', icon: '👤', label: 'Char', unlocked: unlocks.character },
  ];

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-md border-t border-stone-800">
      <div className="flex items-center justify-around max-w-md mx-auto h-[64px] px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => tab.unlocked && onTabChange(tab.id)}
              disabled={!tab.unlocked}
              aria-label={tab.label}
              aria-disabled={!tab.unlocked}
              className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] ${
                tab.unlocked ? 'cursor-pointer active:scale-95' : 'opacity-30 cursor-not-allowed'
              } ${isActive && tab.unlocked ? 'bg-amber-900/20' : 'hover:bg-stone-800/40'}`}
            >
              <span className={`text-xl mb-0.5 ${isActive && tab.unlocked ? 'text-amber-400' : 'text-stone-500'}`}>{tab.icon}</span>
              <span className={`text-[10px] font-mono uppercase tracking-widest ${isActive && tab.unlocked ? 'text-amber-400' : 'text-stone-500'}`}>
                {tab.label}
              </span>
              {isActive && tab.unlocked && <span className="absolute top-0 w-6 h-[2px] bg-amber-500 rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
