import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { loadGameData } from '@/lib/rpg/utils';

export function CharacterSheet() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [characterData, setCharacterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCharacter();
    }
  }, [user, nostr]);

  const loadCharacter = async () => {
    try {
      setLoading(true);
      const character = await loadGameData(nostr, user.pubkey);

      if (character) {
        setCharacterData({
          ...character,
          level: Number(character.level || 1),
          class: character.class || 'adventurer',
          xp: Number(character.xp || 0),
        });
      } else {
        setCharacterData(null);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load character:', err);
      setError('Failed to load character data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading character...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!characterData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No character found. Creating a new adventurer for you...
        </p>
        <Button onClick={loadCharacter} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const { stats, inventory, equipment, gold, quests, location } = characterData;

  return (
    <div className="space-y-6">
      {/* Character Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary">{characterData.class.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-lg font-medium">{characterData.class}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Level {characterData.level} • {characterData.xp} XP
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="whitespace-nowrap">
                {gold} Gold
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Strength</p>
              <p className="text-lg font-bold">{stats.strength}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Dexterity</p>
              <p className="text-lg font-bold">{stats.dexterity}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Intelligence</p>
              <p className="text-lg font-bold">{stats.intelligence}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Constitution</p>
              <p className="text-lg font-bold">{stats.constitution}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Wisdom</p>
              <p className="text-lg font-bold">{stats.wisdom}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Charisma</p>
              <p className="text-lg font-bold">{stats.charisma}</p>
            </div>
          </div>
          
          {/* Equipment */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Equipment</p>
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[80px]">
                <Label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Weapon</Label>
                <Input
                  disabled
                  defaultValue={equipment.weapon || 'None'}
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div className="flex-1 min-w-[80px]">
                <Label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Armor</Label>
                <Input
                  disabled
                  defaultValue={equipment.armor || 'None'}
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div className="flex-1 min-w-[80px]">
                <Label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Accessory</Label>
                <Input
                  disabled
                  defaultValue={equipment.accessory || 'None'}
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Inventory</h3>
            <Button variant="outline" size="sm">
              Sort
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Your inventory is empty.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {inventory.map((item: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-center">
                  <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    {item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : item.type === 'potion' ? '🧪' : '📦'}
                  </div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.type}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">x{item.quantity}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => {/* Travel logic */}}
            variant="outline"
          >
            Travel
          </Button>
          <Button 
            onClick={() => {/* Rest logic */}}
            variant="outline"
          >
            Rest
          </Button>
          <Button 
            onClick={() => {/* Craft logic */}}
            variant="outline"
          >
            Craft
          </Button>
          <Button 
            onClick={() => {/* Quest logic */}}
            variant="outline"
          >
            Quest Log
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}