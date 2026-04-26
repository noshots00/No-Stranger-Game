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
