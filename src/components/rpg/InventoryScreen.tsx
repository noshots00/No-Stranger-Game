import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { loadGameData, saveGameData } from '@/lib/rpg/utils';

export function InventoryScreen() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [inventory, setInventory] = useState<Array<any>>([]);
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { toast } = useToast();

  const loadCharacterData = async () => {
    try {
      setLoading(true);
      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        setInventory(character.inventory || []);
        setGold(character.gold || 0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  // Load initial data
  React.useEffect(() => {
    if (user) {
      loadCharacterData();
    }
  }, [user]);

  const useItem = async (item: any) => {
    try {
      // Remove one item from inventory
      const updatedInventory = [...inventory];
      const itemIndex = updatedInventory.findIndex(i => i.id === item.id);
      
      if (itemIndex !== -1) {
        if (updatedInventory[itemIndex].quantity > 1) {
          updatedInventory[itemIndex].quantity -= 1;
        } else {
          updatedInventory.splice(itemIndex, 1);
        }
        
        setInventory(updatedInventory);
        
        const character = await loadGameData(nostr, user.pubkey);
        if (character) {
          character.inventory = updatedInventory;
          await saveGameData(nostr, user.pubkey, character);
          
          toast({
            title: 'Item Used',
            description: `You used ${item.name}`,
            variant: 'default'
          });
        }
      }
    } catch (error) {
      console.error('Failed to use item:', error);
      toast({
        title: 'Error',
        description: 'Failed to use item',
        variant: 'destructive'
      });
    }
  };

  const dropItem = async (item: any) => {
    try {
      // Remove item from inventory
      const updatedInventory = inventory.filter(i => i.id !== item.id);
      setInventory(updatedInventory);
      
      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        character.inventory = updatedInventory;
        await saveGameData(nostr, user.pubkey, character);
        
        toast({
          title: 'Item Dropped',
          description: `You dropped ${item.name}`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Failed to drop item:', error);
      toast({
        title: 'Error',
        description: 'Failed to drop item',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gold Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Gold</h3>
            <Badge variant="secondary">
              {gold} Gold
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4">
          <div className="w-16 h-16 bg-yellow-500/20 dark:bg-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-yellow-500 text-2xl">💰</span>
          </div>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{gold}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Spend gold at shops to buy equipment and supplies
          </p>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Inventory</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => {}}>
                Sort
              </Button>
              <Button variant="outline" size="sm" onClick={() => {}}>
                Filter
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Your inventory is empty. Defeat enemies or complete quests to find loot!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {inventory.map((item: any) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-3">
                    {item.type === 'weapon' ? '⚔️' : item.type === 'armor' ? '🛡️' : item.type === 'potion' ? '🧪' : item.type === 'quest' ? '📜' : item.type === 'material' ? '🪨' : '📦'}
                  </div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.type}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">x{item.quantity}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-2">{item.description}</p>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={(e) => {
                        e.stopPropagation();
                        useItem(item);
                      }}
                    >
                      Use
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="xs" 
                      onClick={(e) => {
                        e.stopPropagation();
                        dropItem(item);
                      }}
                    >
                      Drop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Details */}
      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{selectedItem.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mr-4">
                {selectedItem.type === 'weapon' ? '⚔️' : selectedItem.type === 'armor' ? '🛡️' : selectedItem.type === 'potion' ? '🧪' : selectedItem.type === 'quest' ? '📜' : selectedItem.type === 'material' ? '🪨' : '📦'}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedItem.type}</p>
                {selectedItem.quantity > 1 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">x{selectedItem.quantity}</p>
                )}
              </div>
            </div>
            
            {selectedItem.description && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Description</p>
                <p className="text-gray-500 dark:text-gray-400">{selectedItem.description}</p>
              </div>
            )}
            
            {selectedItem.stats && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Stats</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(selectedItem.stats).map(([key, value]: [string, number]) => (
                    <div key={key} className="flex items-center">
                      <span className="w-20">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  useItem(selectedItem);
                  setSelectedItem(null);
                }}
              >
                Use Item
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  dropItem(selectedItem);
                  setSelectedItem(null);
                }}
              >
                Drop Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}