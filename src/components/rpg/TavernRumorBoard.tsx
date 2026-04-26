import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { loadGameData, saveGameData } from '@/lib/rpg/utils';

export function TavernRumorBoard() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [rumors, setRumors] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadRumors();
    }
  }, [user, nostr]);

  const loadRumors = async () => {
    try {
      setLoading(true);
      // Load social interaction events that are rumors (kind 7127 with d-tag rumor)
      const rumorEvents = await nostr.query([
        {
          kinds: [7127], // Social Interaction
          '#d': ['rumor'],
          limit: 20
        }
      ]);

      // Also check for recent social posts that might contain rumors
      const recentPosts = await nostr.query([
        {
          kinds: [1], // Text notes
          limit: 50
        }
      ]);

      // Process recent posts for potential rumors
      const processedRumors = recentPosts
        .filter(post => {
          const content = post.content.toLowerCase();
          return content.includes('rumor') || 
                 content.includes('heard') || 
                 content.includes('secret') ||
                 content.includes('hidden') ||
                 content.includes('treasure') ||
                 content.includes('quest') ||
                 content.includes('mysterious') ||
                 content.includes('strange');
        })
        .map(post => ({
          id: post.id,
          content: post.content,
          author: post.pubkey,
          created_at: post.created_at,
          type: 'rumor'
        }));

      // Combine and sort by timestamp
      const allRumors = [
        ...rumorEvents.map(event => ({
          id: event.id,
          content: event.content,
          author: event.pubkey,
          created_at: event.created_at,
          type: 'social_rumor'
        })),
        ...processedRumors
      ]
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
      .slice(0, 10); // Keep latest 10

      setRumors(allRumors);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load rumors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tavern rumors',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const followRumor = async (rumor: any) => {
    try {
      // Create a quest action
      await nostr.event({
        kind: 7673, // Game Action Log
        content: `You decide to investigate the rumor: "${rumor.content.substring(0, 50)}${rumor.content.length > 50 ? '...' : ''}"`,
        tags: [
          ['d', 'rumor_investigation'],
          ['character', user.pubkey],
          ['timestamp', Date.now().toString()]
        ]
      });

      const character = await loadGameData(nostr, user.pubkey);
      if (character) {
        const newQuestId = `rumor_quest_${Date.now()}`;
        const quests = character.quests || { active: [], completed: [] };
        character.quests = {
          active: [...(quests.active || []), newQuestId],
          completed: quests.completed || [],
        };
        await saveGameData(nostr, user.pubkey, character);
      }

      toast({
        title: 'Quest Accepted!',
        description: `You've accepted a quest to investigate the rumor`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to follow rumor:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept quest',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading rumors from the tavern...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Tavern Rumor Board</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {rumors.length} rumors circulating
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rumors.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              The tavern is quiet tonight. Check back later for new rumors and quests.
            </p>
          ) : (
            <>
              {rumors.map((rumor: any, index: number) => (
                <div 
                  key={rumor.id} 
                  className="bg-gray-50 dark:bg-gray-800 rounded p-4 border-l-4 border-primary/50 dark:border-primary/30"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 flex-shrink-0 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mt-1">
                      <span className="text-primary text-sm">📜</span>
                    </div>
                    <div className="flex-1 w-0 min-w-0">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Rumor #{index + 1}
                      </p>
                      <div className="whitespace-pre-wrap break-words text-sm">
                        {rumor.content}
                      </div>
                      <div className="mt-3 flex items-center space-x-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date((rumor.created_at || 0) * 1000).toLocaleDateString()} at 
                          {new Date((rumor.created_at || 0) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {rumor.author && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            • from {rumor.author.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => followRumor(rumor)}
                        className="w-full"
                      >
                        Investigate Rumor
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

       <Card>
         <CardHeader>
           <CardTitle>How Rumors Work</CardTitle>
         </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="mb-2"><strong className="font-medium">Rumors become Quests:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>When you see interesting posts in your feed, they may appear as rumors here</li>
              <li>Investigating a rumor can lead to hidden quests, secret locations, or special encounters</li>
              <li>The more active your social network, the more rumors you'll discover</li>
              <li>Some rumors may lead to challenges from other players (duels!)</li>
            </ul>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
            Tip: Follow interesting people to increase the variety of rumors in your game!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}