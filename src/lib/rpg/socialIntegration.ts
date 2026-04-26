/**
 * Social Layer Integration for No Stranger Game
 * Converts Nostr social activity into game elements
 */

import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEffect } from 'react';

/**
 * Hook to initialize social layer monitoring
 * Watches followed npubs and converts their activity to game events
 */
export function useSocialLayerIntegration() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();

  useEffect(() => {
    if (!user || !nostr) return;
    let isActive = true;

    // Start monitoring followed npubs for social activity
    const monitorSocialActivity = () => {
      try {
        // Get list of followed npubs (from kind 3 contacts or similar)
        // For now, we'll monitor a few public relays for demo purposes
        // In a real implementation, this would use the user's follow list
        
        const subscription = nostr.req([
          {
            kinds: [1], // Text notes
            limit: 10
          }
        ]);

        // Also monitor for replies/mentions
        const mentionSubscription = nostr.req([
          {
            kinds: [1],
            '#p': [user.pubkey], // Posts mentioning the user
            limit: 10
          }
        ]);
        (async () => {
          for await (const msg of subscription) {
            if (!isActive) break;
            if (msg[0] === 'EVENT') {
              // Convert social post to game element
              await processSocialPost(nostr, msg[2]);
            }
          }
        })();
        (async () => {
          for await (const msg of mentionSubscription) {
            if (!isActive) break;
            if (msg[0] === 'EVENT') {
              // Treat mentions as direct interactions/challenges
              await processMention(nostr, msg[2]);
            }
          }
        })();

      } catch (error) {
        console.error('Failed to setup social monitoring:', error);
      }
    };

    monitorSocialActivity();
    return () => {
      isActive = false;
    };
  }, [user, nostr]);
}

/**
 * Process a regular social post and convert it to game elements
 */
const processSocialPost = async (nostr: any, event: any) => {
  try {
    const { content, pubkey, created_at, tags } = event;
    
    // Skip if it's our own post
    // In real implementation, we'd check against user's pubkey
    
    // Analyze content for game conversion
    const gameElement = analyzePostForGame(content, pubkey);
    
    if (gameElement) {
      // Create social interaction event (kind 7127)
      await nostr.event({
        kind: 7127, // Social Interaction
        content: gameElement.description,
        tags: [
          ['d', gameElement.type],
          ['source', pubkey],
          ['event', event.id],
          ['timestamp', created_at.toString()]
        ]
      });

      // Also create a game action log
      await nostr.event({
        kind: 7673, // Game Action Log
        content: `Detected social activity from ${pubkey.slice(0, 8)}...`,
        tags: [
          ['d', 'social_detection'],
          ['character', pubkey], // This would be the player's character in real implementation
          ['timestamp', Date.now().toString()]
        ]
      });
    }
  } catch (error) {
    console.error('Failed to process social post:', error);
  }
};

/**
 * Process a mention/direct interaction
 */
const processMention = async (nostr: any, event: any) => {
  try {
    const { content, pubkey, created_at } = event;
    
    // Convert mention to a potential challenge or interaction
    await nostr.event({
      kind: 7127, // Social Interaction
      content: `Someone mentioned you: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
      tags: [
        ['d', 'mention'],
        ['source', pubkey],
        ['event', event.id],
        ['timestamp', created_at.toString()]
      ]
    });

    // Create duel/challenge opportunity
    await nostr.event({
      kind: 7673, // Game Action Log
      content: `You've been challenged by ${pubkey.slice(0, 8)}... to a duel!`,
      tags: [
        ['d', 'challenge_detected'],
        ['character', pubkey], // Player's character
        ['timestamp', Date.now().toString()]
      ]
    });
  } catch (error) {
    console.error('Failed to process mention:', error);
  }
};

/**
 * Analyze a social post to determine what game element it should become
 */
const analyzePostForGame = (content: string, authorPubkey: string): any => {
  const lowerContent = content.toLowerCase();
  
  // Check for quest/rumor indicators
  if (lowerContent.includes('rumor') || 
      lowerContent.includes('heard') || 
      lowerContent.includes('secret') ||
      lowerContent.includes('hidden') ||
      lowerContent.includes('treasure') ||
      lowerContent.includes('quest')) {
    return {
      type: 'rumor',
      description: `A rumor spreads: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
      gameEffect: 'quest_hook'
    };
  }
  
  // Check for arguments/conflict (potential boss fight)
  if (lowerContent.includes('argue') || 
      lowerContent.includes('disagree') || 
      lowerContent.includes('fight') ||
      lowerContent.includes('debate') ||
      lowerContent.includes('challenge')) {
    return {
      type: 'challenge',
      description: `${authorPubkey.slice(0, 8)}... seems to be looking for a confrontation!`,
      gameEffect: 'duel_opportunity'
    };
  }
  
  // Check for helpful information (tips, advice)
  if (lowerContent.includes('tip') || 
      lowerContent.includes('advice') || 
      lowerContent.includes('help') ||
      lowerContent.includes('guide') ||
      lowerContent.includes('how to')) {
    return {
      type: 'wisdom',
      description: `You overhear valuable advice: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
      gameEffect: 'xp_bonus',
      bonus: 10
    };
  }
  
  // Check for item/marketplace mentions
  if (lowerContent.includes('sell') || 
      lowerContent.includes('buy') || 
      lowerContent.includes('trade') ||
      lowerContent.includes('price') ||
      lowerContent.includes('gold') ||
      lowerContent.includes('coin')) {
    return {
      type: 'market',
      description: `${authorPubkey.slice(0, 8)}... is talking about trade and commerce.`,
      gameEffect: 'shop_opportunity'
    };
  }
  
  // Default: tavern chatter
  return {
    type: 'tavern_chat',
    description: `The tavern chatter includes: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
    gameEffect: 'ambient',
    xp: 1
  };
};

/**
 * Convert followed npbs to NPCs in the game world
 */
export const followedNpubsToNPCs = async (nostr: any, followedNPubs: string[]): Promise<Array<any>> => {
  const npcs = [];
  
  for (const npub of followedNPubs) {
    try {
      // Get the user's profile (kind 0)
      const profileEvents = await nostr.query([
        {
          kinds: [0], // Metadata
          authors: [npub],
          limit: 1
        }
      ]);
      
      let name = `Traveler ${npub.slice(0, 8)}...`;
      let description = 'A mysterious wanderer';
      let avatar = '';
      
      if (profileEvents.length > 0) {
        const profile = JSON.parse(profileEvents[0].content);
        name = profile.display_name || profile.name || name;
        description = profile.about || description;
        avatar = profile.picture || avatar;
      }
      
      // Get recent activity to determine NPC behavior
      const recentEvents = await nostr.query([
        {
          kinds: [1],
          authors: [npub],
          limit: 5
        }
      ]);
      
      let temperament = 'neutral';
      recentEvents.forEach((event: any) => {
        const content = event.content.toLowerCase();
        if (content.includes('help') || content.includes('kind') || content.includes('friend')) {
          temperament = 'friendly';
        } else if (content.includes('fight') || content.includes('argue') || content.includes('hate')) {
          temperament = 'hostile';
        }
      });
      
      npcs.push({
        id: npub,
        name,
        description,
        avatar,
        temperament,
        lastSeen: Math.floor(Date.now() / 1000),
        dialogue: generateNPCDialogue(temperament, name)
      });
    } catch (error) {
      console.error(`Failed to process followed npub ${npub}:`, error);
      // Add as generic traveler
      npcs.push({
        id: npub,
        name: `Wanderer ${npub.slice(0, 8)}...`,
        description: 'A traveler of few words',
        avatar: '',
        temperament: 'mysterious',
        lastSeen: Math.floor(Date.now() / 1000),
        dialogue: ["*nods silently*", "*gazes into the distance*", "*adjusts their cloak*"]
      });
    }
  }
  
  return npcs;
};

/**
 * Generate appropriate dialogue for an NPC based on temperament
 */
const generateNPCDialogue = (temperament: string, name: string): string[] => {
  const dialogues: Record<string, string[]> = {
    friendly: [
      "Well met, traveler! The road can be dangerous these days.",
      "Have you heard any interesting news from the market?",
      "I could use a strong arm for a task I've been putting off.",
      "Stay safe out there. Watch for bandits on the old forest path."
    ],
    hostile: [
      "What do you want? Can't you see I'm busy?",
      "You're not welcome here. Turn back while you still can.",
      "I've got my eye on you, stranger. Don't try anything funny.",
      "This town's seen enough trouble. We don't need your kind here."
    ],
    mysterious: [
      "...",
      "The stars whisper of great changes coming...",
      "Have you visited the ruins to the north? Few return unchanged.",
      "Knowledge is a dangerous thing to seek. Are you prepared for what you might find?"
    ],
    neutral: [
      "Good day.",
      "The weather's been odd lately, hasn't it?",
      "I'm just passing through, myself.",
      "*nods in acknowledgment*"
    ]
  };
  
  return dialogues[temperament] || dialogues.neutral;
};