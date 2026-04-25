import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { NoteContent } from '@/components/NoteContent';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar, ScrollbarThumb, ScrollbarTrack } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/useToast';

export function ChatLog() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const [messages, setMessages] = useState<Array<any>>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      loadChatMessages();
      setupRealtimeUpdates();
    }
  }, [user, nostr]);

  const loadChatMessages = async () => {
    try {
      setLoading(true);
      // Load recent game action logs (kind 7673) for this user
      const actionEvents = await nostr.query([
        {
          kinds: [7673], // Game Action Log
          '#d': ['social_interaction'], // Filter for social interactions converted to game events
          limit: 50
        }
      ]);

      // Also load social interactions kind
      const socialEvents = await nostr.query([
        {
          kinds: [7127], // Social Interaction
          limit: 50
        }
      ]);

      // Combine and sort by timestamp
      const allEvents = [...actionEvents, ...socialEvents]
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
        .slice(0, 50);

      setMessages(allEvents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    // Setup subscription for new messages
    const subscription = nostr.req([
      {
        kinds: [7673, 7127],
        limit: 1
      }
    ]);

    subscription.on('event', (event) => {
      setMessages(prev => [event, ...prev.slice(0, 49)]); // Keep last 50
    });

    return () => {
      subscription.close();
    };
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      // Create a social interaction event that converts this chat to game element
      await nostr.event({
        kind: 7127, // Social Interaction
        content: inputValue,
        tags: [
          ['d', 'chat_message'],
          ['source', user.pubkey],
          ['timestamp', Math.floor(Date.now() / 1000).toString()]
        ]
      });

      setInputValue('');
      
      // Also log as game action
      await nostr.event({
        kind: 7673, // Game Action Log
        content: `Sent chat message: ${inputValue.substring(0, 50)}${inputValue.length > 50 ? '...' : ''}`,
        tags: [
          ['d', 'chat_message'],
          ['character', user.pubkey],
          ['timestamp', Math.floor(Date.now() / 1000).toString()]
        ]
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.create({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-12 h-12 border-4 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Game Chat</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length} messages
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No chat messages yet. Start talking to see game interactions appear here!
                </p>
              ) : (
                <>
                  {messages.map((message: any, index: number) => (
                    <div 
                      key={message.id || index} 
                      className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 flex-shrink-0 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                        {message.kind === 7127 ? '💬' : '⚔️'}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 w-0 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Adventurer
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {/* Format timestamp */}
                              {new Date((message.created_at || 0) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                           {message.kind === 7127 && (
                             <span className="text-xs bg-blue-500/20 dark:bg-blue-500/30 text-blue-500 dark:text-blue-400 rounded px-2 py-0.5">
                               Social
                             </span>
                           )}
                           {message.kind === 7673 && (
                             <span className="text-xs bg-green-500/20 dark:bg-green-500/30 text-green-500 dark:text-green-400 rounded px-2 py-0.5">
                               Action
                             </span>
                           )}
                        </div>
                        <div className="whitespace-pre-wrap break-words text-sm">
                          <NoteContent event={message} className="text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setMessages([])}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
          </ScrollArea>
          
          {/* Message Input */}
          <div className="flex space-x-3 mt-4">
            <Label className="flex-1 w-0 min-w-0 block">
              Chat Input
            </Label>
            <div className="flex-1 w-0 min-w-0">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message here..."
                className="input"
              />
            </div>
            <Button 
              onClick={sendMessage}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}