import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Circle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';
import { saveGameData } from '@/lib/rpg/utils';

export function CharacterCreation() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('adventurer');
  const [background, setBackground] = useState('wanderer');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const classes = [
    { id: 'adventurer', name: 'Adventurer', description: 'Balanced stats, versatile playstyle', icon: '⚔️' },
    { id: 'warrior', name: 'Warrior', description: 'High strength and constitution, excels in melee combat', icon: '🛡️' },
    { id: 'mage', name: 'Mage', description: 'High intelligence and wisdom, powerful spellcaster', icon: '🔮' },
    { id: 'rogue', name: 'Rogue', description: 'High dexterity and charisma, skilled in stealth and tricks', icon: '🎭' }
  ];

  const backgrounds = [
    { id: 'wanderer', name: 'Wanderer', description: 'You have traveled far and wide, starting with extra gold', goldBonus: 50 },
    { id: 'soldier', name: 'Soldier', description: 'Trained in combat from youth, starting with better weapons', weaponBonus: 'iron_sword' },
    { id: 'scholar', name: 'Scholar', description: 'Learned in the ways of magic and lore, starting with extra knowledge', xpBonus: 100 },
    { id: 'street_rat', name: 'Street Rat', description: 'You know the hidden paths and secrets of the city', itemBonus: 'lockpick' }
  ];

  const handleCreateCharacter = async () => {
    if (!name.trim()) {
      toast.create({
        title: 'Error',
        description: 'Please enter a character name',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Calculate starting stats based on class and background
      const baseStats = {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
        wisdom: 10,
        charisma: 10
      };

      // Apply class modifiers
      const classModifiers: Record<string, Record<string, number>> = {
        adventurer: {}, // No modifiers
        warrior: { strength: 3, constitution: 3, intelligence: -2 },
        mage: { intelligence: 3, wisdom: 3, strength: -2 },
        rogue: { dexterity: 3, charisma: 3, constitution: -2 }
      };

      const classMod = classModifiers[characterClass] || {};
      const stats = {
        strength: Math.max(3, baseStats.strength + (classMod.strength || 0)),
        dexterity: Math.max(3, baseStats.dexterity + (classMod.dexterity || 0)),
        intelligence: Math.max(3, baseStats.intelligence + (classMod.intelligence || 0)),
        constitution: Math.max(3, baseStats.constitution + (classMod.constitution || 0)),
        wisdom: Math.max(3, baseStats.wisdom + (classMod.wisdom || 0)),
        charisma: Math.max(3, baseStats.charisma + (classMod.charisma || 0))
      };

      // Apply background bonuses
      const backgroundInfo = backgrounds.find(b => b.id === background) || {};
      const goldBonus = backgroundInfo.goldBonus || 0;
      const xpBonus = backgroundInfo.xpBonus || 0;

      // Create initial inventory based on background
      let inventory: any[] = [];
      if (backgroundInfo.weaponBonus) {
        inventory.push({
          id: `${backgroundInfo.weaponBonus}_${Date.now()}`,
          name: backgroundInfo.weaponBonus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          type: 'weapon',
          quantity: 1,
          description: `A trusty weapon from your ${backgroundInfo.name} days`
        });
      }
      if (backgroundInfo.itemBonus) {
        inventory.push({
          id: `${backgroundInfo.itemBonus}_${Date.now()}`,
          name: backgroundInfo.itemBonus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          type: 'material',
          quantity: 1,
          description: `A useful item from your background`
        });
      }

      // Add some starting gold
      inventory.push({
        id: `gold_coin_${Date.now()}`,
        name: 'Gold Coin',
        type: 'material',
        quantity: 100 + goldBonus,
        description: 'Your starting funds'
      });

      // Create character data
      const characterData = {
        name,
        stats,
        inventory,
        equipment: {
          weapon: inventory.find(item => item.type === 'weapon')?.id || null,
          armor: null,
          accessory: null
        },
        gold: 100 + goldBonus, // This is redundant with inventory but keeping for compatibility
        quests: {
          active: [],
          completed: []
        },
        location: 'starting_town',
        class: characterClass,
        background,
        level: 1,
        xp: xpBonus
      };

      // Save character to Nostr
      await nostr.event({
        kind: 3223, // Character Profile
        content: JSON.stringify(characterData),
        tags: [
          ['d', user.pubkey], // Character ID based on pubkey
          ['class', characterClass],
          ['level', '1'],
          ['xp', xpBonus.toString()]
        ]
      });

      toast.create({
        title: 'Character Created!',
        description: `Welcome to the world, ${name} the ${characterClass}!`,
        variant: 'default'
      });

      // In a real app, this would navigate to the main game interface
      // For now, we'll just reset the form
      setName('');
      setCharacterClass('adventurer');
      setBackground('wanderer');
    } catch (error) {
      console.error('Failed to create character:', error);
      toast.create({
        title: 'Error',
        description: 'Failed to create character',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Please log in to create a character
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create Your Character
          </CardTitle>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Choose your path and begin your adventure in No Stranger Game
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Character Name */}
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Character Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your character's name"
              className="input"
            />
          </div>

          {/* Character Class */}
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Character Class
            </Label>
            <div className="space-y-2">
              {classes.map(cls => (
                <RadioGroupItem 
                  key={cls.id} 
                  value={cls.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{cls.icon}</span>
                        <span className="font-medium">{cls.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {cls.description}
                      </span>
                    </div>
                  </div>
                  <RadioIndicator className="h-4 w-4" />
                </RadioGroupItem>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Background
            </Label>
            <div className="space-y-2">
              {backgrounds.map(bg => (
                <RadioGroupItem 
                  key={bg.id} 
                  value={bg.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                   <div className="flex-1">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <span className="text-lg">📜</span>
                         <span className="font-medium">{bg.name}</span>
                       </div>
                       <span className="text-xs text-gray-500 dark:text-gray-400">
                         {bg.description}
                       </span>
                     </div>
                     {bg.goldBonus && (
                       <div className="mt-1 text-xs text-green-500 dark:text-green-400">
                         +{bg.goldBonus} starting gold
                       </div>
                     )}
                     {bg.xpBonus && (
                       <div className="mt-1 text-xs text-blue-500 dark:text-blue-400">
                         +{bg.xpBonus} starting XP
                       </div>
                     )}
                     {bg.weaponBonus && (
                       <div className="mt-1 text-xs text-yellow-500 dark:text-yellow-400">
                         Starting weapon: {bg.weaponBonus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                       </div>
                     )}
                     {bg.itemBonus && (
                       <div className="mt-1 text-xs text-purple-500 dark:text-purple-400">
                         Starting item: {bg.itemBonus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                       </div>
                     )}
                   </div>
                   <span className="h-4 w-4 flex items-center justify-center">
                     <Circle className="h-2.5 w-2.5 fill-current text-current" />
                   </span>
                </RadioGroupItem>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Preview
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>
                    <span>{name || 'Enter your name'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Class:</span>
                    <span>
                      {classes.find(c => c.id === characterClass)?.name || characterClass}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Background:</span>
                    <span>
                      {backgrounds.find(b => b.id === background)?.name || background}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Starting Gold:</span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {100 + (backgrounds.find(b => b.id === background)?.goldBonus || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Starting XP:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {backgrounds.find(b => b.id === background)?.xpBonus || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={() => {
              // Reset form
              setName('');
              setCharacterClass('adventurer');
              setBackground('wanderer');
            }}
          >
            Reset
          </Button>
          <Button 
            onClick={handleCreateCharacter}
            variant="primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Begin Adventure'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}