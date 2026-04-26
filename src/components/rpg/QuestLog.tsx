import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { loadGameData, saveGameData } from '@/lib/rpg/utils';

export function QuestLog() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [quests, setQuests] = useState<Array<any>>([]);
  const [activeQuests, setActiveQuests] = useState<Array<any>>([]);
  const [completedQuests, setCompletedQuests] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadQuests();
    }
  }, [user, nostr]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        setQuests(character.quests || { active: [], completed: [] });
        setActiveQuests(character.quests?.active || []);
        setCompletedQuests(character.quests?.completed || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load quests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quest data',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      // Remove from active quests, add to completed
      const newActive = activeQuests.filter(id => id !== questId);
      const newCompleted = [...completedQuests, questId];
      
      setActiveQuests(newActive);
      setCompletedQuests(newCompleted);
      
      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        character.quests = {
          active: newActive,
          completed: newCompleted
        };
        await saveGameData(nostr, user.pubkey, character);
        
        toast({
          title: 'Quest Completed!',
          description: 'You have completed a quest',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete quest',
        variant: 'destructive'
      });
    }
  };

  const abandonQuest = async (questId: string) => {
    try {
      // Remove from active quests
      const newActive = activeQuests.filter(id => id !== questId);
      setActiveQuests(newActive);
      
      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        character.quests = {
          active: newActive,
          completed: completedQuests
        };
        await saveGameData(nostr, user.pubkey, character);
        
        toast({
          title: 'Quest Abandoned',
          description: 'You have abandoned this quest',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Failed to abandon quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to abandon quest',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading quests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quest Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Quest Overview</h3>
            <Badge variant="secondary">
              {activeQuests.length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-500 dark:text-green-400">{completedQuests.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{activeQuests.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Active Quests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Active Quests</h3>
            {activeQuests.length > 0 && (
              <Button variant="outline" size="sm">
                Track All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeQuests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No active quests. Visit the tavern or talk to NPCs to find new adventures!
            </p>
          ) : (
            <div className="space-y-3">
              {activeQuests.map((questId: string, index: number) => (
                <div key={questId} className="bg-gray-50 dark:bg-gray-800 rounded p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 dark:bg-blue-500/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-500 text-sm">📜</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Quest #{index + 1}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Adventure awaits!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="xs" 
                        onClick={() => completeQuest(questId)}
                      >
                        Complete
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="xs" 
                        onClick={() => abandonQuest(questId)}
                      >
                        Abandon
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                      Return to the quest giver to claim your reward.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Quests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Completed Quests</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedQuests.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No completed quests yet. Complete your first quest to see it here!
            </p>
          ) : (
            <div className="space-y-2">
              {completedQuests.slice(0, 5).map((questId: string, index: number) => (
                <div key={questId} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-500 dark:text-gray-400">Quest #{index + 1}</span>
                  <span className="text-green-500 dark:text-green-400 font-medium">Completed</span>
                </div>
              ))}
              {completedQuests.length > 5 && (
                <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
                  and {completedQuests.length - 5} more...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}