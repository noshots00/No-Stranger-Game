export const CHAPTER_PROOF_KIND = 7673;

export interface ChapterChoiceProofPayload {
  app: 'no-stranger-game';
  chapterId: string;
  chapterWindowId: string;
  selectedOption: 'A' | 'B' | 'C';
  prompt: string;
  consequence: string;
  characterId: string;
  recordedAt: number;
}

export interface ChapterChoiceProofEvent {
  id: string;
  pubkey: string;
  created_at: number;
  tags: string[][];
  content: string;
}

export const getChapterWindowId = (): string => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `season-3-${yyyy}-${mm}-${dd}`;
};

export const getCanonicalChoiceKey = (chapterWindowId: string, pubkeyOrCharacterId: string): string =>
  `nsg:chapter-proof:${pubkeyOrCharacterId}:${chapterWindowId}`;

export const hasCanonicalChoiceForWindow = (chapterWindowId: string, pubkeyOrCharacterId: string): boolean => {
  try {
    return Boolean(localStorage.getItem(getCanonicalChoiceKey(chapterWindowId, pubkeyOrCharacterId)));
  } catch {
    return false;
  }
};

export const markCanonicalChoiceForWindow = (chapterWindowId: string, pubkeyOrCharacterId: string, eventId: string): void => {
  try {
    localStorage.setItem(getCanonicalChoiceKey(chapterWindowId, pubkeyOrCharacterId), eventId);
  } catch {
    // Ignore storage errors to preserve gameplay flow.
  }
};

export const getWindowTag = (event: ChapterChoiceProofEvent): string | undefined =>
  event.tags.find(([name]) => name === 'window')?.[1];

export const resolveCanonicalChoiceFromEvents = (
  events: ChapterChoiceProofEvent[],
  chapterWindowId: string,
  pubkeyOrCharacterId: string,
): ChapterChoiceProofEvent | null => {
  const candidates = events.filter((event) => getWindowTag(event) === chapterWindowId);
  if (candidates.length === 0) return null;

  const canonical = [...candidates].sort((a, b) => {
    if (a.created_at !== b.created_at) return a.created_at - b.created_at;
    return a.id.localeCompare(b.id);
  })[0];

  markCanonicalChoiceForWindow(chapterWindowId, pubkeyOrCharacterId, canonical.id);
  return canonical;
};
