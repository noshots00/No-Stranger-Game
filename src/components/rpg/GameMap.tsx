import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { loadGameData, saveGameData } from '@/lib/rpg/utils';

export function GameMap() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [locations, setLocations] = useState<Array<any>>([]);
  const [currentLocation, setCurrentLocation] = useState('starting_town');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWorldData();
    }
  }, [user, nostr]);

  const loadWorldData = async () => {
    try {
      setLoading(true);
      // Load character location
      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        setCurrentLocation(character.location || 'starting_town');
      }

      // Load world state (towns, NPCs, etc.)
      const worldEvents = await nostr.query([
        {
          kinds: [1283], // World State
          limit: 50
        }
      ]);

      // Process world events into locations
      const processedLocations = worldEvents
        .filter(event => event.tags.some(tag => tag[0] === 'type' && tag[1] === 'town'))
        .map(event => {
          const data = JSON.parse(event.content);
          return {
            id: event.tags.find(tag => tag[0] === 'd')?.[1] || 'unknown',
            name: data.name || 'Unknown Town',
            description: data.description || '',
            npcs: data.npcs || [],
            shops: data.shops || [],
            connections: data.connections || [],
            x: data.x || 0,
            y: data.y || 0
          };
        });

      setLocations(processedLocations);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load world data:', error);
      setLoading(false);
    }
  };

  const moveToLocation = async (locationId: string) => {
    try {
      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        character.location = locationId;
        await saveGameData(nostr, user.pubkey, character);
        
        setCurrentLocation(locationId);
      }
    } catch (error) {
      console.error('Failed to move to location:', error);
    }
  };

    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="inline-block w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading world map...</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Current Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Current Location</h3>
              <Button variant="outline" size="sm">
                Travel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-3">
                <MapPin className="text-primary text-xl" />
              </div>
              <h2 className="text-2xl font-bold">{currentLocation.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</h2>
              <p className="text-gray-500 dark:text-gray-400">
                You are currently in {currentLocation.replace('_', ' ').replace(/\b\w/g, c => c.toLowerCase())}
              </p>
            </div>
            
            {/* Location Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => {/* Enter tavern logic */}}
                variant="outline"
              >
                Visit Tavern
              </Button>
              <Button 
                onClick={() => {/* Enter shop logic */}}
                variant="outline"
              >
                Visit Shop
              </Button>
              <Button 
                onClick={() => {/* Enter wilderness logic */}}
                variant="outline"
              >
                Explore Wilderness
              </Button>
              <Button 
                onClick={() => {/* Check for quests logic */}}
                variant="outline"
              >
                Check for Quests
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* Nearby Points of Interest */}
      <Card>
       <CardHeader>
         <CardTitle>Points of Interest</CardTitle>
       </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* This would be populated with actual nearby POIs based on current location */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-500 dark:text-gray-400">Tavern</span>
              <span className="text-green-500 dark:text-green-400">Open</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-500 dark:text-gray-400">General Store</span>
              <span className="text-green-500 dark:text-green-400">Open</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-500 dark:text-gray-400">Blacksmith</span>
              <span className="text-green-500 dark:text-green-400">Open</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="text-gray-500 dark:text-gray-400">Quest Board</span>
              <span className="text-yellow-500 dark:text-yellow-400">Available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}