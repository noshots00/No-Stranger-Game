import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';

interface CharacterContextType {
  character: any | null;
  loading: boolean;
  error: string | null;
  refreshCharacter: () => Promise<void>;
  updateCharacter: (updates: Partial<any>) => Promise<void>;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const toast = useToast();
  const [character, setCharacter] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharacter = useCallback(async () => {
    if (!user || !nostr) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const characterEvents = await nostr.query([
        {
          kinds: [3223], // Character Profile
          authors: [user.pubkey],
          limit: 1
        }
      ]);

      if (characterEvents.length > 0) {
        const characterData = JSON.parse(characterEvents[0].content);
        setCharacter(characterData);
      } else {
        setCharacter(null);
      }
    } catch (err) {
      console.error('Failed to load character:', err);
      setError('Failed to load character data');
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  }, [user, nostr]);

  const updateCharacter = useCallback(async (updates: Partial<any>) => {
    if (!user || !nostr) return;
    
    try {
      // Get current character
      let currentCharacter = character;
      if (!currentCharacter) {
        // Try to load if we don't have it
        const characterEvents = await nostr.query([
          {
            kinds: [3223], // Character Profile
            authors: [user.pubkey],
            limit: 1
          }
        ]);
        
        if (characterEvents.length > 0) {
          currentCharacter = JSON.parse(characterEvents[0].content);
        }
      }
      
      // Merge updates with current character
      const updatedCharacter = {
        ...(currentCharacter || {}),
        ...updates
      };
      
      // Save to Nostr
      await nostr.event({
        kind: 3223, // Character Profile
        content: JSON.stringify(updatedCharacter),
        tags: [
          ['d', user.pubkey],
          ['class', updatedCharacter.class || 'adventurer'],
          ['level', updatedCharacter.level?.toString() || '1'],
          ['xp', updatedCharacter.xp?.toString() || '0']
        ]
      });
      
      // Update local state
      setCharacter(updatedCharacter);
      
      toast.create({
        title: 'Character Updated',
        description: 'Your character has been updated',
        variant: 'default'
      });
    } catch (err) {
      console.error('Failed to update character:', err);
      toast.create({
        title: 'Error',
        description: 'Failed to update character',
        variant: 'destructive'
      });
      throw err;
    }
  }, [user, nostr, character, toast]);

  // Load character when user changes
  useEffect(() => {
    if (user) {
      loadCharacter();
    } else {
      setCharacter(null);
    }
  }, [user, loadCharacter]);

  const contextValue = {
    character,
    loading,
    error,
    refreshCharacter: loadCharacter,
    updateCharacter
  };

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}