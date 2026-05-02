import type { QuestChoice, QuestStep, WorldEventLogEntry } from '@/components/rpg/quests/types';

/** Replace `{playerName}` placeholders (same convention as quest dialogue text). */
export function interpolateQuestWorldLogTemplates(lines: string[], playerName: string): string[] {
  const name = playerName.trim() || 'Stranger';
  return lines.map((line) => line.replaceAll('{playerName}', name));
}

export function appendUniqueWorldEntries(
  existing: WorldEventLogEntry[],
  texts: string[],
  baseAtMs = Date.now()
): WorldEventLogEntry[] {
  if (texts.length === 0) return existing;
  const seen = new Set(existing.map((e) => e.text));
  const next = [...existing];
  let offset = 0;
  for (const text of texts) {
    if (seen.has(text)) continue;
    seen.add(text);
    next.push({ text, atMs: baseAtMs + offset });
    offset += 1;
  }
  return next;
}

/** Lines declared on the choice step (any choice) and/or on the selected choice. */
export function collectChoiceWorldLogLines(
  currentStep: QuestStep,
  selectedChoice: QuestChoice,
  playerName: string
): string[] {
  const lines: string[] = [];
  if (currentStep.type === 'choice' && currentStep.worldEventLogAfterChoice?.length) {
    lines.push(...interpolateQuestWorldLogTemplates(currentStep.worldEventLogAfterChoice, playerName));
  }
  if (selectedChoice.worldEventLogAdd?.length) {
    lines.push(...interpolateQuestWorldLogTemplates(selectedChoice.worldEventLogAdd, playerName));
  }
  return lines;
}
