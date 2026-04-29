import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

interface FeedPost {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  relay: string;
  isGamePost: boolean;
}

const GAME_TAG = 'no-stranger';
const MAX_POSTS = 12;

export function GlobalNostrFeed() {
  const { nostr } = useNostr();
  const feedQuery = useQuery({
    queryKey: ['nostr', 'global-feed', GAME_TAG],
    queryFn: async () => {
      const events = await nostr.query([{ kinds: [1], limit: MAX_POSTS * 2, '#t': [GAME_TAG] }]);
      const items = events
        .filter((evt) => typeof evt.content === 'string' && evt.content.trim().length > 0)
        .map<FeedPost>((evt) => ({
          id: evt.id,
          author: evt.pubkey.slice(0, 6),
          content: evt.content,
          timestamp: evt.created_at * 1000,
          relay: 'pool',
          isGamePost: evt.tags.some((tag) => tag[0] === 't' && tag[1] === GAME_TAG),
        }))
        .slice(0, MAX_POSTS);
      return items;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const posts = useMemo(() => feedQuery.data ?? [], [feedQuery.data]);
  const loading = feedQuery.isLoading;

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
