import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

const ECHO_WINDOW_SECONDS = 7 * 24 * 60 * 60;
const ECHO_NOTE_LIMIT = 50;

export interface EchoesData {
  rumorSeeds: string[];
  eventsFlavorLines: string[];
  mainQuestFlavorLine?: string;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'have', 'just', 'into', 'they', 'them',
]);

const sanitizeContent = (content: string): string =>
  content
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b/g, ' ')
    .replace(/\bnsec1[a-z0-9]{20,}\b/gi, ' ')
    .replace(/[^\w#' -]/g, ' ');

const extractTokens = (content: string): string[] => {
  const cleaned = sanitizeContent(content);
  const hashtags = cleaned.match(/#[a-zA-Z0-9_-]{3,}/g)?.map((tag) => tag.slice(1).toLowerCase()) ?? [];
  const words = cleaned
    .split(/\s+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word) && /^[a-z0-9_-]+$/.test(word));
  return [...hashtags, ...words];
};

export function useEchoes(userPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<EchoesData>({
    queryKey: ['nostr', 'echoes', userPubkey ?? ''],
    enabled: Boolean(userPubkey),
    staleTime: 60_000,
    queryFn: async () => {
      if (!userPubkey) return { rumorSeeds: [], eventsFlavorLines: [] };

      const since = Math.floor(Date.now() / 1000) - ECHO_WINDOW_SECONDS;
      const notes = await nostr.query(
        [{ kinds: [1], authors: [userPubkey], since, limit: ECHO_NOTE_LIMIT }],
        { signal: AbortSignal.timeout(6000) },
      );

      const scoreMap = new Map<string, number>();
      for (const note of notes) {
        const tokens = extractTokens(note.content);
        const recencyBoost = Math.max(1, 3 - Math.floor((Date.now() / 1000 - note.created_at) / (24 * 60 * 60)));
        for (const token of tokens) {
          scoreMap.set(token, (scoreMap.get(token) ?? 0) + recencyBoost);
        }
      }

      const rumorSeeds = [...scoreMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([seed]) => seed);

      if (rumorSeeds.length === 0) {
        return {
          rumorSeeds: [],
          eventsFlavorLines: ['A quiet rumor passes through the market, too faint to name.'],
        };
      }

      return {
        rumorSeeds,
        eventsFlavorLines: rumorSeeds.map((seed) => `A trader whispers about ${seed}.`),
        mainQuestFlavorLine: `The crowd murmurs a familiar word: ${rumorSeeds[0]}.`,
      };
    },
  });
}
