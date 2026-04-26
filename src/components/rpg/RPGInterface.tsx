import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { CharacterSheet } from './CharacterSheet';
import { InventoryScreen } from './InventoryScreen';
import { QuestLog } from './QuestLog';
import { GameMap } from './GameMap';
import { ChatLog } from './ChatLog';
import { CombatSystem } from './CombatSystem';
import { TavernRumorBoard } from './TavernRumorBoard';
import { CharacterCreation } from './CharacterCreation';
import { AudioManager } from './AudioManager';
import { LoginArea } from '@/components/auth/LoginArea';

export function RPGInterface() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [activeTab, setActiveTab] = useState<'character' | 'inventory' | 'quests' | 'map' | 'chat' | 'combat' | 'rumors' | 'creation'>('creation');
  const [gameInitialized, setGameInitialized] = useState(false);
  const [characterExists, setCharacterExists] = useState(false);
  const [socialIntegrationInitialized, setSocialIntegrationInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize game data for user
  useEffect(() => {
    if (user && nostr) {
      initializeGame();
    }
  }, [user, nostr]);

  // Initialize social layer integration
  useEffect(() => {
    if (user && nostr) {
      setSocialIntegrationInitialized(true);
    }
  }, [user, nostr]);

  const initializeGame = async () => {
    if (!user || !nostr) return;
    
    console.log('Initializing game for user:', user.pubkey.slice(0, 8));
    
    try {
      // Check if character exists
      const characterEvents = await nostr.query([
        {
          kinds: [3223], // Character Profile
          authors: [user.pubkey],
          limit: 1
        }
      ]);

      const exists = characterEvents.length > 0;
      console.log('Character exists:', exists);
      
      setCharacterExists(exists);
      
      // Set active tab based on whether character exists
      if (!exists) {
        // Show character creation screen
        console.log('No character found, showing creation screen');
        setActiveTab('creation');
      } else {
        // Go to character sheet
        console.log('Character found, showing character sheet');
        setActiveTab('character');
      }
      setGameInitialized(true);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setInitError(String(error));
      // If we can't check, show creation screen
      setActiveTab('creation');
      setGameInitialized(true);
    }
  };

  // Show login screen if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-gray-900 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white">
              No Stranger Game
            </h1>
            <p className="text-gray-300">
              An RPG that lives inside your social network
            </p>
          </div>
          <div className="w-full border-2 border-dashed border-gray-600 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-white text-center">
              Connect Your Nostr Account
            </h2>
            <LoginArea className="w-full flex flex-col gap-3" />
          </div>
          <p className="text-sm text-gray-400 text-center">
            Once connected, you'll enter the game world
          </p>
        </div>
      </div>
    );
  }

  // Show loading while initializing
  if (!gameInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Initializing Your Adventure...</h2>
          <div className="w-12 h-12 border-4 border-purple-500/50 border-t-purple-400 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your character data from Nostr...</p>
        </div>
      </div>
    );
  }

  // Show error/welcome screen if initialization failed or no character
  if (initError || !characterExists) {
    // Show character creation as the default when there's no character
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-100 dark:from-purple-900 dark:to-gray-900 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ⚔️ No Stranger Game
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                🧙 {user.pubkey.slice(0, 8)}...
              </span>
            </div>
          </div>
          <CharacterCreation onCharacterCreated={() => {
            setCharacterExists(true);
            setActiveTab('character');
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-gray-100 dark:from-purple-900 dark:to-gray-900">
      <AudioManager />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ⚔️ No Stranger Game
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                🧙 {user.pubkey.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
            <button
              onClick={() => setActiveTab('creation')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'creation'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => setActiveTab('character')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'character'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              👤 Character
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🎒 Inventory
            </button>
            <button
              onClick={() => setActiveTab('quests')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'quests'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              📜 Quests
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'map'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🗺️ Map
            </button>
            <button
              onClick={() => setActiveTab('rumors')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'rumors'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🍺 Rumors
            </button>
            <button
              onClick={() => setActiveTab('combat')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'combat'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              ⚔️ Combat
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              💬 Chat
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'character' && <CharacterSheet />}
            {activeTab === 'inventory' && <InventoryScreen />}
            {activeTab === 'quests' && <QuestLog />}
            {activeTab === 'map' && <GameMap />}
            {activeTab === 'rumors' && <TavernRumorBoard />}
            {activeTab === 'combat' && <CombatSystem />}
            {activeTab === 'chat' && <ChatLog />}
            {activeTab === 'creation' && <CharacterCreation onCharacterCreated={() => setActiveTab('character')} />}
          </div>
        </div>
      </div>
    </div>
  );
}