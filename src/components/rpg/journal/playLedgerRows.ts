import type { ChronicleSegment } from '../dialogueFormat';
import type { DialogueLogEntry } from '../quests/types';
import type { QuestDefinition } from '../quests/types';
import { questScopedStorySortMs } from './playLedgerAnchor';

export type PlayLedgerTimelineRow =
  | { kind: 'global'; segment: ChronicleSegment; sortMs: number }
  | { kind: 'quest_slot'; questId: string; sortMs: number; prints: ChronicleSegment[] };

export type PlayLedgerBuildResult = {
  interleaved: PlayLedgerTimelineRow[];
  unopenedQuestIds: string[];
};

function segmentSourceQuestId(segment: ChronicleSegment): string | undefined {
  if (segment.type === 'world') return undefined;
  return segment.lines.find((line) => line.sourceQuestId)?.sourceQuestId;
}

function segmentBaseSortMs(segment: ChronicleSegment): number {
  if (segment.type === 'world') return segment.row.atMs;
  return segment.lines[0]?.atMs ?? 0;
}

/** One character-update line per segment so quest tags are not merged away. */
function explodeCharacterUpdateSegments(
  segments: readonly ChronicleSegment[]
): ChronicleSegment[] {
  const out: ChronicleSegment[] = [];
  for (const segment of segments) {
    if (
      segment.type === 'dialogueBlock' &&
      segment.role === 'character_update' &&
      segment.lines.length > 1
    ) {
      for (const line of segment.lines) {
        out.push({ type: 'dialogueBlock', role: 'character_update', lines: [line] });
      }
      continue;
    }
    out.push(segment);
  }
  return out;
}

function singleLineCharacterUpdateSegment(line: DialogueLogEntry): ChronicleSegment {
  return { type: 'dialogueBlock', role: 'character_update', lines: [line] };
}

function printSortMs(
  segment: ChronicleSegment,
  questFirstOpenedAtMs: Readonly<Record<string, number>>
): number {
  const base = segmentBaseSortMs(segment);
  return questScopedStorySortMs(base, segmentSourceQuestId(segment), questFirstOpenedAtMs);
}

/**
 * Unified Play timeline: global prints interleave by time; each opened quest is a
 * slot (card + its tagged prints) anchored at first open.
 */
export function buildPlayLedgerRows(
  playFeedSegments: readonly ChronicleSegment[],
  questCardRows: readonly QuestDefinition[],
  questFirstOpenedAtMs: Readonly<Record<string, number>> = {}
): PlayLedgerBuildResult {
  const exploded = explodeCharacterUpdateSegments(playFeedSegments);
  const printsByQuestId = new Map<string, ChronicleSegment[]>();
  const globalSegments: ChronicleSegment[] = [];

  for (const segment of exploded) {
    const sourceQuestId = segmentSourceQuestId(segment);
    if (sourceQuestId && questFirstOpenedAtMs[sourceQuestId] !== undefined) {
      const bucket = printsByQuestId.get(sourceQuestId) ?? [];
      bucket.push(segment);
      printsByQuestId.set(sourceQuestId, bucket);
    } else {
      globalSegments.push(segment);
    }
  }

  for (const [questId, prints] of printsByQuestId) {
    prints.sort(
      (a, b) =>
        printSortMs(a, questFirstOpenedAtMs) - printSortMs(b, questFirstOpenedAtMs)
    );
    printsByQuestId.set(questId, prints);
  }

  const units: Array<PlayLedgerTimelineRow & { seq: number }> = [];
  let seq = 0;

  for (const segment of globalSegments) {
    units.push({ kind: 'global', segment, sortMs: segmentBaseSortMs(segment), seq: seq++ });
  }

  for (const quest of questCardRows) {
    const openMs = questFirstOpenedAtMs[quest.id];
    if (openMs === undefined) continue;
    units.push({
      kind: 'quest_slot',
      questId: quest.id,
      sortMs: openMs,
      prints: printsByQuestId.get(quest.id) ?? [],
      seq: seq++,
    });
    printsByQuestId.delete(quest.id);
  }

  // Quest-tagged prints for quests that were opened but are no longer in questCardRows.
  for (const [questId, prints] of printsByQuestId) {
    const openMs = questFirstOpenedAtMs[questId];
    if (openMs === undefined || prints.length === 0) continue;
    units.push({ kind: 'quest_slot', questId, sortMs: openMs, prints, seq: seq++ });
  }

  // Opened quest with no bucket entry yet — still show the card anchor.
  units.sort((a, b) => {
    if (a.sortMs !== b.sortMs) return a.sortMs - b.sortMs;
    if (a.kind !== b.kind) return a.kind === 'quest_slot' ? -1 : 1;
    return a.seq - b.seq;
  });

  const unopenedQuestIds = questCardRows
    .filter((quest) => questFirstOpenedAtMs[quest.id] === undefined)
    .map((quest) => quest.id);

  return {
    interleaved: units.map(({ seq: _seq, ...row }) => row),
    unopenedQuestIds,
  };
}

export { singleLineCharacterUpdateSegment, printSortMs };
