import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { AudioInitializer } from '@/components/AudioInitializer';
import BottomNav from '@/components/BottomNav';
import CharacterScreen from '@/components/CharacterScreen';
import MapView, { type MapLocation } from '@/components/MapView';
import PlayView from '@/components/PlayView';
import TavernBounties from '@/components/TavernBounties';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useDialogueEngine } from '@/hooks/useDialogueEngine';
import { useIdleLoop } from '@/hooks/useIdleLoop';
import { useNostrPersistence } from '@/hooks/useNostrPersistence';
import { usePlayerBroadcast } from '@/hooks/usePlayerBroadcast';
import type { TabId } from '@/types/game';
import { getNextEstMidnight } from '@/utils/time';

export default function GameContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [audioReady, setAudioReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('play');
  const [openTavernBoard, setOpenTavernBoard] = useState(false);
  const [pubkey, setPubkey] = useState<string>();
  const { broadcast } = usePlayerBroadcast();

  useEffect(() => {
    const nextTab = location.pathname.includes('/map') ? 'map' : location.pathname.includes('/character') ? 'character' : 'play';
    setActiveTab(nextTab);
  }, [location.pathname]);

  useEffect(() => {
    if (!window.nostr) return;
    void window.nostr.getPublicKey().then(setPubkey).catch(() => setPubkey(undefined));
  }, []);

  const { state, loading, save } = useNostrPersistence(pubkey);
  const dialogue = useDialogueEngine(state, save);
  const { playSFX } = useAudioEngine(dialogue.region);
  const hasVisibleDialogueState =
    dialogue.history.length > 0 ||
    Boolean(dialogue.currentPrompt?.length) ||
    dialogue.inputMode === 'text' ||
    dialogue.step === 'vignettes' ||
    dialogue.step === 'idle_play';

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onError = (event: ErrorEvent) => {
      console.error('[GameContainer][window.error]', event.message, event.filename, event.lineno);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GameContainer][unhandledrejection]', event.reason);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  useIdleLoop(
    state
      ? {
          profession: state.character.profession,
          location: state.character.region,
          shelter: state.character.shelter,
          traits: state.character.traits,
          hourlyCopper: state.character.hourlyCopper,
          hourlyXp: state.character.hourlyXp,
          lastSimTime: state.character.lastSimTime,
          day: state.character.day,
          health: state.character.health,
          maxHealth: state.character.maxHealth,
        }
      : null,
    (result) => {
      if (!state) return;
      result.logs.forEach((line) => dialogue.handleSimulationLog(line));
      save({
        character: {
          ...state.character,
          day: result.day,
          hourlyCopper: result.newHourlyCopper,
          hourlyXp: result.newHourlyXp,
          lastSimTime: result.lastSimTime,
          health: Math.min(state.character.maxHealth, state.character.health + result.healthDelta),
          copperAccumulated: state.character.copperAccumulated + result.copperEarned,
          xpAccumulated: state.character.xpAccumulated + result.xpEarned,
        },
      });
      if (result.day > state.character.day) {
        broadcast('DAILY_SURVIVAL', { name: state.tutorial.name || 'Traveler', day: String(result.day) });
      }
    },
  );

  const mapLocations = useMemo<MapLocation[]>(
    () => [
      { id: 'forest', name: 'Forest', icon: '🌲', status: 'available' },
      {
        id: 'village',
        name: 'Village',
        icon: '🏘️',
        status: dialogue.unlocks.tavern ? 'visited' : 'new',
        notification: !dialogue.unlocks.tavern,
        subLocations: dialogue.unlocks.activities.questsTab
          ? [{ id: 'quests', name: 'Player Quests', icon: '📜', status: 'available', notification: true }]
          : undefined,
      },
    ],
    [dialogue.unlocks.activities.questsTab, dialogue.unlocks.tavern],
  );

  if (loading || !state) {
    return <div className="h-[100dvh] flex items-center justify-center bg-stone-950 text-stone-400">Syncing with the clearing...</div>;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-950 text-stone-200">
      {!audioReady && <AudioInitializer onReady={() => setAudioReady(true)} />}
      <main className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Navigate to="/play" replace />} />
          <Route
            path="/play"
            element={
              hasVisibleDialogueState ? (
                <PlayView
                  day={state.character.day}
                  region={dialogue.region}
                  history={dialogue.history}
                  currentPrompt={dialogue.currentPrompt}
                  inputMode={dialogue.inputMode}
                  step={dialogue.step}
                  onChoice={(opt) => {
                    playSFX('tap');
                    dialogue.handleChoice(opt);
                  }}
                  onNameSubmit={dialogue.handleNameSubmit}
                  onCompleteVignettes={dialogue.completeVignettes}
                  scrollRef={dialogue.scrollRef}
                />
              ) : (
                <div className="h-full flex items-center justify-center px-6 text-center text-stone-300">
                  <div className="space-y-2">
                    <p className="text-sm font-mono uppercase tracking-wider text-stone-400">Recovering Dialogue State</p>
                    <p className="text-xs text-stone-500">step={dialogue.step} input={dialogue.inputMode} history={dialogue.history.length} prompt={dialogue.currentPrompt?.length ?? 0}</p>
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/map"
            element={
              openTavernBoard ? (
                <TavernBounties
                  currentDay={state.character.day}
                  completedQuestIds={state.completedQuestIds}
                  onApplyModifiers={(mods) => {
                    const nextModifiers = { ...state.character.modifiers };
                    Object.entries(mods).forEach(([key, value]) => {
                      nextModifiers[key] = (nextModifiers[key] ?? 0) + value;
                    });
                    save({ character: { ...state.character, modifiers: nextModifiers, traits: [...new Set([...state.character.traits, ...Object.keys(mods)])] } });
                  }}
                  onCompleteQuest={(id) => {
                    if (state.completedQuestIds.includes(id)) return;
                    playSFX('quest');
                    save({ completedQuestIds: [...state.completedQuestIds, id] });
                    broadcast('QUEST_COMPLETE');
                  }}
                  estMidnightTimestamp={getNextEstMidnight()}
                />
              ) : (
                <MapView
                  locations={mapLocations}
                  onTravel={(id) => {
                    playSFX('travel');
                    if (id === 'quests') {
                      setOpenTavernBoard(true);
                      return;
                    }
                    dialogue.handleMapInteraction(id);
                  }}
                  isTutorialPhase={dialogue.step !== 'idle_play'}
                />
              )
            }
          />
          <Route path="/character" element={<CharacterScreen state={state} />} />
        </Routes>
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          playSFX('tap');
          setOpenTavernBoard(false);
          setActiveTab(tab);
          navigate(`/${tab}`);
        }}
        unlocks={{ map: dialogue.unlocks.map, character: dialogue.unlocks.profile }}
      />
    </div>
  );
}
