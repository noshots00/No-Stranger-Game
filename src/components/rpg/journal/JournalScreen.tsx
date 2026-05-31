import { useMemo, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { DialogueVoiceBlock } from '../DialogueVoiceBlock';
import type { ChronicleSegment } from '../dialogueFormat';
import type { JournalLogEntry, QuestDefinition } from '../quests/types';
import {
  ORIGIN_QUEST_OPENED_FLAG,
  WORLD_EVENT_PRINTS_ENABLED,
} from '../constants';
import { QuestCardHeader } from './QuestCardHeader';
import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_COMMAND_GRID,
  RPG_UI_BODY,
  RPG_UI_EMPHASIS,
} from '../typography/rpgUiTypography';

type PlayLedgerTimelineRow =
  | { kind: 'story'; segment: ChronicleSegment; sortMs: number }
  | { kind: 'journal_group'; entries: JournalLogEntry[]; sortMs: number; groupKey: string };

export type JournalScreenProps = {
  playFeedSegments: ChronicleSegment[];
  playJournalLines: readonly JournalLogEntry[];
  newQuestIds: readonly string[];
  questTitleById: Record<string, string>;
  visibleQuests: QuestDefinition[];
  completedQuestIds: string[];
  onOpenQuest: (questId: string) => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  visibleLocationActions: string[];
  playerFlags: string[];
  onLocationAction?: (actionLabel: string) => void;
};

export function JournalScreen({
  playFeedSegments,
  playJournalLines,
  newQuestIds,
  questTitleById,
  visibleQuests,
  completedQuestIds,
  onOpenQuest,
  dialogueScrollRef,
  onDialogueScroll,
  visibleLocationActions,
  playerFlags,
  onLocationAction,
}: JournalScreenProps) {
  const playLedgerRows = useMemo((): PlayLedgerTimelineRow[] => {
    const rows: Array<PlayLedgerTimelineRow & { seq: number }> = [];
    let seq = 0;

    for (const segment of playFeedSegments) {
      const sortMs = segment.type === 'world' ? segment.row.atMs : segment.lines[0]?.atMs ?? 0;
      rows.push({ kind: 'story', segment, sortMs, seq: seq++ });
    }

    const dayReports = playFeedSegments
      .map((segment, index) => {
        if (segment.type !== 'dialogueBlock' || segment.role !== 'report') return null;
        const firstLine = segment.lines[0];
        if (!firstLine) return null;
        if (!/^Day\s+\d+\s+Report$/i.test(firstLine.text.trim())) return null;
        return { atMs: firstLine.atMs, key: `report-${index}-${firstLine.id}` };
      })
      .filter((entry): entry is { atMs: number; key: string } => entry !== null)
      .sort((a, b) => a.atMs - b.atMs);

    const sortedJournalEntries = [...playJournalLines].sort((a, b) => a.atMs - b.atMs);
    const entriesByReport = new Map<string, JournalLogEntry[]>();
    const trailingEntries: JournalLogEntry[] = [];
    for (const entry of sortedJournalEntries) {
      const matchingReport = dayReports.find((report) => entry.atMs <= report.atMs);
      if (!matchingReport) {
        trailingEntries.push(entry);
        continue;
      }
      if (!entriesByReport.has(matchingReport.key)) entriesByReport.set(matchingReport.key, []);
      entriesByReport.get(matchingReport.key)!.push(entry);
    }

    for (const report of dayReports) {
      const entries = entriesByReport.get(report.key);
      if (!entries || entries.length === 0) continue;
      rows.push({
        kind: 'journal_group',
        entries,
        sortMs: entries[0].atMs,
        groupKey: report.key,
        seq: seq++,
      });
    }
    if (trailingEntries.length > 0) {
      rows.push({
        kind: 'journal_group',
        entries: trailingEntries,
        sortMs: trailingEntries[0].atMs,
        groupKey: 'trailing-journal',
        seq: seq++,
      });
    }

    rows.sort((a, b) => (a.sortMs !== b.sortMs ? a.sortMs - b.sortMs : a.seq - b.seq));
    return rows.map(({ seq: _seq, ...row }) => row);
  }, [playFeedSegments, playJournalLines]);

  const completedQuestIdSet = useMemo(() => new Set(completedQuestIds), [completedQuestIds]);
  const questCardRows = useMemo(
    () => visibleQuests.filter((q) => !completedQuestIdSet.has(q.id)),
    [visibleQuests, completedQuestIdSet]
  );

  const hasOpenedOriginQuest = playerFlags.includes(ORIGIN_QUEST_OPENED_FLAG);
  const resolveQuestBriefing = (questId: string, defaultBriefing: string): string =>
    questId === 'quest-001-origin' && hasOpenedOriginQuest
      ? 'Welcome to No Stranger Game'
      : defaultBriefing;

  return (
    <section className="relative flex h-full flex-col gap-1.5">
      <div
        ref={dialogueScrollRef}
        onScroll={onDialogueScroll}
        className="facsimile-scroll min-h-0 flex-1 overflow-y-auto pr-0 [scroll-padding-bottom:min(8dvh,80px)]"
      >
        <div className="play-feed-scroll-inner facsimile-scroll-dialogue-inner !pl-[16px] !pr-[16px] space-y-1">
          {playLedgerRows.map((row, idx) => {
            if (row.kind === 'story') {
              const segment = row.segment;
              if (segment.type === 'world') {
                const wr = segment.row;
                return (
                  <div key={`world-${wr.atMs}-${idx}-${wr.text.slice(0, 24)}`} className="dialogue-line-reveal py-0.5">
                    <p className="font-sans text-[0.6875rem] italic leading-snug text-[var(--candle-ember)]/80">
                      {wr.text}
                    </p>
                  </div>
                );
              }
              const first = segment.lines[0];
              return (
                <div
                  key={`${segment.role}-${first?.id ?? `b-${idx}`}`}
                  className="dialogue-line-reveal py-0.5"
                >
                  <DialogueVoiceBlock presentation="play" role={segment.role} lines={segment.lines} />
                </div>
              );
            }

            const dayEntries = row.entries;
            return (
              <div key={`journal-group-${row.groupKey}`} className="py-0.5">
                <div className="space-y-3">
                  {dayEntries.map((je) => {
                    const summaryText = je.text.trim();
                    const showTitle = !completedQuestIdSet.has(je.questId);
                    return (
                      <div key={je.id} className="space-y-1">
                        {showTitle ? (
                          <p className={`${RPG_UI_EMPHASIS} text-[var(--candle-flame-soft)]`}>
                            {questTitleById[je.questId] ?? 'Quest'}
                          </p>
                        ) : null}
                        {summaryText.length > 0 ? (
                          <div className={cn('space-y-1', showTitle && 'pt-1')}>
                            <p className={`whitespace-pre-line ${RPG_UI_BODY}`}>{summaryText}</p>
                          </div>
                        ) : null}
                        {WORLD_EVENT_PRINTS_ENABLED && je.playMilestones && je.playMilestones.length > 0 ? (
                          <div className="space-y-1 pt-1">
                            {je.playMilestones.map((line, milestoneIdx) => (
                              <p
                                key={`${je.id}-milestone-${milestoneIdx}`}
                                className="font-sans text-[0.6875rem] italic leading-snug text-[var(--candle-ember)]/80"
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {questCardRows.map((quest) => {
            const isNew = newQuestIds.includes(quest.id);
            const briefingText = resolveQuestBriefing(quest.id, quest.briefing);
            const questCardInteractive = quest.questCardInteractive !== false;
            return (
              <div key={`quest-card-${quest.id}`} className="py-1">
                <QuestCardHeader
                  quest={quest}
                  title={quest.title}
                  briefingText={briefingText}
                  isNew={isNew}
                  interactive={questCardInteractive}
                  onOpen={questCardInteractive ? () => onOpenQuest(quest.id) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>

      {visibleLocationActions.length > 0 ? (
        <div className="space-y-1.5 border-t border-[var(--candle-rule)] pt-2">
          <div className={RPG_COMMAND_GRID}>
            {visibleLocationActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onLocationAction?.(action)}
                className={cn(RPG_COMMAND_CHIP, RPG_COMMAND_CHIP_LABEL, 'min-h-[var(--rpg-command-min-h)]')}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
