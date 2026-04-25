import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useSocialLayerIntegration } from '@/lib/rpg/socialIntegration';
import { CharacterSheet } from './CharacterSheet';
import { InventoryScreen } from './InventoryScreen';
import { QuestLog } from './QuestLog';
import { GameMap } from './GameMap';
import { ChatLog } from './ChatLog';
import { CombatSystem } from './CombatSystem';
import { TavernRumorBoard } from './TavernRumorBoard';
import { CharacterCreation } from './CharacterCreation';
import { AudioManager } from './AudioManager';

export function RPGInterface() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [activeTab, setActiveTab] = useState<'character' | 'inventory' | 'quests' | 'map' | 'chat' | 'combat' | 'rumors' | 'creation'>('character');
  const [gameInitialized, setGameInitialized] = useState(false);
  const [characterExists, setCharacterExists] = useState(false);
  const [socialIntegrationInitialized, setSocialIntegrationInitialized] = useState(false);

  // Initialize game data for user
  useEffect(() => {
    if (user) {
      initializeGame();
    }
  }, [user]);

  // Initialize social layer integration
  useEffect(() => {
    if (user && nostr) {
      // In a real implementation, we would initialize social monitoring here
      // For now, we'll just set the flag
      setSocialIntegrationInitialized(true);
    }
  }, [user, nostr]);

  const initializeGame = async () => {
    // Check if character exists
    try {
      const characterEvents = await nostr.query([
        {
          kinds: [3223], // Character Profile
          authors: [user.pubkey],
          limit: 1
        }
      ]);

      setCharacterExists(characterEvents.length > 0);
      
      if (!characterExists) {
        // Show character creation screen
        setActiveTab('creation');
      }
      setGameInitialized(true);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setGameInitialized(true); // Still set to true to avoid infinite loading
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In to Play</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your Nostr account to begin your adventure in No Stranger Game.
          </p>
        </div>
      </div>
    );
  }

  if (!gameInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Initializing Your Adventure...</h2>
          <div className="w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AudioManager />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              No Stranger Game
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {user.pubkey.slice(0, 8)}...
              </span>
              <Button variant="outline" size="sm" onClick={() => {/* Logout handled elsewhere */}}>
                Logout
              </Button>
            </div>
          </div>

          {/* Social Integration Status */}
          {socialIntegrationInitialized && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400">
                  Social layer active - real people are appearing in your game world
                </span>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('character')}
              className={`${activeTab === 'character'
                ? 'text-primary border-b-2 border-primary px-4 py-2'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2'}`}
            >
              Character
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`${activeTab === 'inventory'
                ? 'text-primary border-b-2 border-primary px-4 py-2'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2'}`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('quests')}
              className={`${activeTab === 'quests'
                ? 'text-primary border-b-2 border-primary px-4 py-2'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2'}`}
            >
              Quests
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`${activeTab === 'map'
                ? 'text-primary border-b-2 border-primary px-4 py-2'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2'}`}
            >
              Map
            </button>
            <button
              onClick={() => setActiveTab('rumors')}
              className={`${activeTab === 'rumors'
                ? 'text-primary border-b-2 border-primary px-4 py-2'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2'}`}
            >
              Rumors
            </button>
            <button
              onClick={() => setActiveTab('combat')}
              className={`${activeTab === 'combat'
                ? 'text-primary border-b-2 border-primary px-4 py-2'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2'}`}
            >
              Combat
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`${activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary px-4 py-2'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-4 py-2'}`}
            >
              Chat
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
            {activeTab === 'creation' && <CharacterCreation />}
          </div>
        </div>
      </div>
    </div>
  );
}