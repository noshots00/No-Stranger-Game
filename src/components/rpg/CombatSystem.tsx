import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';
import { calculateCombatDamage, generateRandomEncounter, generateEnemyLoot } from '@/lib/rpg/utils';

export function CombatSystem() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [combatState, setCombatState] = useState<'idle' | 'encounter' | 'fighting' | 'victory' | 'defeat'>('idle');
  const [encounter, setEncounter] = useState<any>(null);
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [playerMaxHP, setPlayerMaxHP] = useState(100);
  const [enemyMaxHP, setEnemyMaxHP] = useState(100);
  const [combatLog, setCombatLog] = useState<Array<string>>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load character data to get stats
  useEffect(() => {
    if (user) {
      loadCharacterStats();
    }
  }, [user]);

  const loadCharacterStats = async () => {
    try {
      const characterEvents = await nostr.query([
        {
          kinds: [3223], // Character Profile
          authors: [user.pubkey],
          limit: 1
        }
      ]);

      if (characterEvents.length > 0) {
        const character = JSON.parse(characterEvents[0].content);
        // Set base HP from constitution stat (10 HP per constitution point)
        const baseHP = character.stats.constitution * 10;
        setPlayerMaxHP(baseHP);
        setPlayerHP(baseHP);
      }
    } catch (error) {
      console.error('Failed to load character stats:', error);
    }
  };

  const startRandomEncounter = async (location: string = 'starting_town') => {
    setLoading(true);
    setCombatState('encounter');
    
    try {
      // Generate a random encounter based on location
      const encounterData = generateRandomEncounter(location);
      setEncounter(encounterData);
      
      // Set enemy HP based on difficulty
      const enemyBaseHP = encounterData.difficulty * 20;
      setEnemyMaxHP(enemyBaseHP);
      setEnemyHP(enemyBaseHP);
      
      // Add to combat log
      setCombatLog(prev => [
        ...prev,
        `A wild ${encounterData.enemy} appears! (Difficulty: ${encounterData.difficulty})`
      ]);
      
      // Set to fighting state after a brief delay
      setTimeout(() => {
        setCombatState('fighting');
        setIsPlayerTurn(true); // Player goes first
      }, 1500);
    } catch (error) {
      console.error('Failed to start encounter:', error);
      setCombatState('idle');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const playerAttack = async () => {
    if (!encounter || !isPlayerTurn) return;
    
    setIsPlayerTurn(false);
    
    // In a real implementation, we would get actual stats from character
    const playerStrength = 10; // Placeholder
    const playerLevel = 1; // Would come from character data
    const enemyDefense = encounter.difficulty * 2; // Simplified
    const enemyLevel = encounter.difficulty; // Simplified
    
    const damage = calculateCombatDamage(
      playerStrength, 
      enemyDefense, 
      5, // Weapon damage (placeholder)
      playerLevel,
      enemyLevel
    );
    
    setEnemyHP(prev => Math.max(0, prev - damage));
    
    setCombatLog(prev => [
      ...prev,
      `You strike the ${encounter.enemy} for ${damage} damage!`
    ]);
    
    // Check if enemy is defeated
    if (enemyHP <= damage) {
      setCombatState('victory');
      setTimeout(() => {
        handleVictory();
      }, 2000);
    } else {
      // Enemy turn after delay
      setTimeout(() => {
        enemyTurn();
      }, 1500);
    }
  };

  const enemyTurn = () => {
    setIsPlayerTurn(true);
    
    // Simplified enemy attack
    const enemyAttack = encounter.difficulty * 2;
    const playerDefense = 5; // Placeholder
    const damage = Math.max(0, enemyAttack - playerDefense + Math.floor(Math.random() * 5) - 2);
    
    setPlayerHP(prev => Math.max(0, prev - damage));
    
    setCombatLog(prev => [
      ...prev,
      `The ${encounter.enemy} hits you for ${damage} damage!`
    ]);
    
    // Check if player is defeated
    if (damage >= playerHP) {
      setCombatState('defeat');
      setTimeout(() => {
        handleDefeat();
      }, 2000);
    }
  };

  const handleVictory = () => {
    // Give rewards
    const reward = {
      gold: encounter.reward.gold,
      xp: encounter.reward.xp
    };
    
    setCombatLog(prev => [
      ...prev,
      `You defeated the ${encounter.enemy}!`,
      `Gained ${reward.gold} gold and ${reward.xp} XP.`
    ]);
    
    // Generate loot
    const loot = generateEnemyLoot(encounter.enemy, 1); // Would pass actual player level
    if (loot.length > 0) {
      const lootText = loot.map(item => `${item.quantity}x ${item.item}`).join(', ');
      setCombatLog(prev => [
        ...prev,
        `You found: ${lootText}`
      ]);
    }
    
    // Update character with rewards (in real implementation)
    // For now, just log it
    toast({
      title: 'Victory!',
      description: `You defeated the ${encounter.enemy} and gained rewards`,
      variant: 'default'
    });
  };

  const handleDefeat = () => {
    setCombatLog(prev => [
      ...prev,
      `You have been defeated by the ${encounter.enemy}...`,
      `You wake up in town with minor injuries.`
    ]);
    
    // Penalties for defeat (lose some gold, etc.)
    toast({
      title: 'Defeat',
      description: `You were defeated but managed to escape. You wake up in town.`,
      variant: 'destructive'
    });
    
    // Return to town after delay
    setTimeout(() => {
      setCombatState('idle');
      setEncounter(null);
      setPlayerHP(playerMaxHP); // Restore HP
    }, 3000);
  };

  const fleeEncounter = () => {
    // 50% chance to flee successfully
    if (Math.random() < 0.5) {
      setCombatLog(prev => [
        ...prev,
        `You successfully fled from the ${encounter.enemy}!`
      ]);
      setCombatState('idle');
      setEncounter(null);
      setPlayerHP(playerMaxHP); // Restore HP
    } else {
      setCombatLog(prev => [
        ...prev,
        `You tried to flee but the ${encounter.enemy} blocks your path!`
      ]);
      // Enemy gets a free attack
      setTimeout(() => {
        enemyTurn();
      }, 1000);
    }
  };

  useEffect(() => {
    // Auto-start an encounter when entering the component (for demo)
    // In real implementation, this would be triggered by player action
    if (user && combatState === 'idle' && !encounter) {
      // Commented out to prevent auto-combat on load
      // startRandomEncounter();
    }
  }, [user, combatState, encounter]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Combat System</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {combatState === 'idle' ? 'Ready' : combatState === 'encounter' ? 'Encounter!' : combatState === 'fighting' ? 'Fighting!' : combatState === 'victory' ? 'Victory!' : 'Defeat'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Combat Log */}
          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded p-4 overflow-y-auto mb-4">
            {combatLog.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No combat yet. Engage an enemy to begin fighting!
              </p>
            ) : (
              <div className="space-y-2">
                {combatLog.map((log: string, index: number) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Combatants Display */}
          {combatState !== 'idle' && encounter && (
            <div className="grid grid-cols-3 gap-6 items-center">
              {/* Player */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 dark:bg-blue-500/30 rounded-full flex items-center justify-center mb-2">
                  <span className="text-blue-500 text-xl">👤</span>
                </div>
                <div className="font-medium">You</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{ width: `${(playerHP / playerMaxHP) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {playerHP}/{playerMaxHP} HP
                </div>
              </div>
              
              {/* VS */}
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500/20 dark:bg-yellow-500/30 rounded-full flex items-center justify-center">
                  <span className="text-yellow-500 text-xl">VS</span>
                </div>
              </div>
              
              {/* Enemy */}
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 dark:bg-red-500/30 rounded-full flex items-center justify-center mb-2">
                  {encounter.enemy === 'Goblin Scout' ? '👹' : 
                   encounter.enemy === 'Street Urchin' ? '🧒' : 
                   encounter.enemy === 'Town Guard' ? '🛡️' : 
                   encounter.enemy === 'Wolf Pack' ? '🐺' : 
                   encounter.enemy === 'Bandit' ? '🏴‍☠️' : 
                   encounter.enemy === 'Forest Sprite' ? '🧚' : 
                   encounter.enemy === 'Ancient Tree Spirit' ? '🌳' : 
                   encounter.enemy === 'Stone Golem' ? '🪨' : 
                   encounter.enemy === 'Skeleton' ? '💀' : 
                   encounter.enemy === 'Zombie' ? '🧟' : 
                   encounter.enemy === 'Treasure Chest' ? '🪙' : '❓'}
                </div>
                <div className="font-medium">{encounter.enemy}</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2.5 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${(enemyHP / enemyMaxHP) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {enemyHP}/{enemyMaxHP} HP
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          {combatState === 'fighting' && encounter && (
            <div className="grid grid-cols-2 gap-3">
              {isPlayerTurn ? (
                <>
                  <Button 
                    onClick={playerAttack}
                    variant="primary"
                    className="w-full"
                  >
                    Attack
                  </Button>
                  <Button 
                    onClick={fleeEncounter}
                    variant="outline"
                    className="w-full"
                  >
                    Flee
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Enemy's turn...
                  </p>
                  <div className="w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin mx-auto"></div>
                </div>
              )}
            </div>
          )}
          
          {/* Victory/Defeat Screen */}
          {(combatState === 'victory' || combatState === 'defeat') && (
            <div className="text-center py-8">
              {combatState === 'victory' ? (
                <>
                  <div className="w-20 h-20 bg-green-500/20 dark:bg-green-500/30 rounded-full flex items-center justify-center mb-4">
                    <span className="text-green-500 text-3xl">🏆</span>
                  </div>
                  <h3 className="text-xl font-bold text-green-500 dark:text-green-400">
                    Victory!
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    You have defeated the ${encounter.enemy}!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-500/20 dark:bg-red-500/30 rounded-full flex items-center justify-center mb-4">
                    <span className="text-red-500 text-3xl">💀</span>
                  </div>
                  <h3 className="text-xl font-bold text-red-500 dark:text-red-400">
                    Defeat
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    You have been defeated by the ${encounter.enemy}.
                  </p>
                </>
              )}
              <Button 
                onClick={() => {
                  setCombatState('idle');
                  setEncounter(null);
                  setPlayerHP(playerMaxHP);
                  setEnemyHP(enemyMaxHP);
                  setCombatLog([]);
                }}
                variant="outline"
              >
                Continue
              </Button>
            </div>
          )}
          
          {/* Encounter Button (when idle) */}
          {combatState === 'idle' && !encounter && (
            <div className="text-center">
              <Button 
                onClick={() => startRandomEncounter()}
                variant="primary"
              >
                Seek Adventure
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

       {/* Info Card */}
       <Card>
         <CardHeader>
           <CardTitle>How Combat Works</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="mb-2"><strong className="font-medium">Combat Mechanics:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Turn-based combat - you and your enemy take turns attacking</li>
              <li>Damage is calculated based on your stats, enemy stats, and randomness</li>
              <li>Critical hits (natural 20) do double damage</li>
              <li>Higher level characters have advantages in combat</li>
              <li>You can attempt to flee, but there's a risk of failure</li>
            </ul>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
            Tip: Visit different locations to encounter stronger enemies with better rewards!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}