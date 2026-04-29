import { useCallback, useEffect, useRef, useState } from 'react';

interface FeedPost {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  relay: string;
  isGamePost: boolean;
}

const RELAYS = ['wss://relay.nostr.band', 'wss://nos.lol', 'wss://relay.damus.io'];
const GAME_TAG = 'no-stranger';
const MAX_POSTS = 12;
const SUBSCRIPTION_TIMEOUT_MS = 4000;

export function GlobalNostrFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reqIdRef = useRef('');
  const mountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(['CLOSE', reqIdRef.current]));
      wsRef.current.close();
    }
    wsRef.current = null;
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    reqIdRef.current = crypto.randomUUID();
    setLoading(true);
    setPosts([]);

    const connectRelay = (relayUrl: string, attempt = 0) => {
      if (!mountedRef.current) return;
      const ws = new WebSocket(relayUrl);
      wsRef.current = ws;
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          if (attempt < RELAYS.length - 1) connectRelay(RELAYS[attempt + 1], attempt + 1);
        }
      }, SUBSCRIPTION_TIMEOUT_MS);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.send(JSON.stringify(['REQ', reqIdRef.current, { kinds: [1], limit: MAX_POSTS * 2, '#t': [GAME_TAG] }]));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data as string) as [string, string, { id: string; pubkey: string; content: string; created_at: number; tags: string[][] }];
        if (data[0] === 'EVENT' && data[2]?.content) {
          const evt = data[2];
          const isGame = evt.tags.some((tag) => tag[0] === 't' && tag[1] === GAME_TAG);
          setPosts((prev) => {
            if (prev.some((post) => post.id === evt.id) || prev.length >= MAX_POSTS) return prev;
            return [
              {
                id: evt.id,
                author: evt.pubkey.slice(0, 6),
                content: evt.content,
                timestamp: evt.created_at * 1000,
                relay: relayUrl,
                isGamePost: isGame,
              },
              ...prev,
            ].slice(0, MAX_POSTS);
          });
        } else if (data[0] === 'EOSE') {
          setLoading(false);
        }
      };

      ws.onerror = () => clearTimeout(timeout);
      ws.onclose = () => {
        clearTimeout(timeout);
        if (mountedRef.current && attempt < RELAYS.length - 1) {
          setTimeout(() => connectRelay(RELAYS[attempt + 1], attempt + 1), 1500);
        } else if (mountedRef.current) {
          setLoading(false);
        }
      };
    };

    connectRelay(RELAYS[0]);
    return cleanup;
  }, [cleanup]);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'moments ago';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-6 pt-5 border-t border-stone-800 animate-fadeIn">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Across the World
      </h3>
      <div className="space-y-2.5 max-h-[25vh] overflow-y-auto pr-1 scrollbar-thin">
        {loading && posts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-stone-600 italic animate-pulse">Listening to distant voices...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-stone-600 italic">The winds carry no whispers today.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className={`p-3 rounded-lg border ${post.isGamePost ? 'bg-amber-900/10 border-amber-800/30' : 'bg-stone-900/30 border-stone-800'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full ${post.isGamePost ? 'bg-amber-700/40' : 'bg-stone-700/50'}`} />
                <span className="text-[10px] font-mono text-stone-500">
                  {post.author} · {formatTime(post.timestamp)}
                </span>
              </div>
              <p className="text-sm text-stone-300 leading-snug line-clamp-3 break-words">{post.content}</p>
            </article>
          ))
        )}
      </div>
      <p className="text-[9px] text-stone-600 mt-3 font-mono text-center">Broadcast on Nostr. Your choices echo here.</p>
    </div>
  );
}
