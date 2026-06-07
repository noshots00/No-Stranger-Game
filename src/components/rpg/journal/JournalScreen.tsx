import { useMemo, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import { DialogueVoiceBlock } from '../DialogueVoiceBlock';
import type { ChronicleSegment } from '../dialogueFormat';
import type { JournalLogEntry, QuestDefinition } from '../quests/types';
import {
  ORIGIN_QUEST_OPENED_FLAG,
  WORLD_EVENT_PRINTS_ENABLED,
} from '../constants';
import { ActiveStateCard } from './ActiveStateCard';
import { QuestCardHeader } from './QuestCardHeader';
import type { QuestState } from '../quests/types';
import type { VillageProjectProgress } from '../villageProjects/villageProjectNostr';
import {
  RPG_CHOICE_GRID,
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
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
  /** Tracked beat — always show its card when incomplete, even if unveil list lagged. */
  activeQuest?: QuestDefinition | null;
  completedQuestIds: string[];
  onOpenQuest: (questId: string) => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  visibleLocationActions: string[];
  playerFlags: string[];
  onLocationAction?: (actionLabel: string) => void;
  /** Idle journal card — profession earnings + next day countdown. */
  activeJobSlug?: string | null;
  skills?: QuestState['skills'];
  dayCounter?: number;
  dayPacingActive?: boolean;
  nextDayResetMs?: number | null;
  communityProject?: Pick<VillageProjectProgress, 'definition' | 'totals'> | null;
  /** Extra classes on the root section. */
  className?: string;
};

export function JournalScreen({
  playFeedSegments,
  playJournalLines,
  newQuestIds,
  questTitleById,
  visibleQuests,
  activeQuest = null,
  completedQuestIds,
  onOpenQuest,
  dialogueScrollRef,
  onDialogueScroll,
  visibleLocationActions,
  playerFlags,
  onLocationAction,
  activeJobSlug = null,
  skills,
  dayCounter = 1,
  dayPacingActive = false,
  nextDayResetMs = null,
  communityProject = null,
  className,
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
        const lastLine = segment.lines[segment.lines.length - 1];
        const endAtMs = lastLine?.atMs ?? firstLine.atMs;
        return { atMs: firstLine.atMs, endAtMs, key: `report-${index}-${firstLine.id}` };
      })
      .filter((entry): entry is { atMs: number; endAtMs: number; key: string } => entry !== null)
      .sort((a, b) => a.atMs - b.atMs);

    const sortedJournalEntries = [...playJournalLines].sort((a, b) => a.atMs - b.atMs);
    const entriesByReport = new Map<string, JournalLogEntry[]>();
    const trailingEntries: JournalLogEntry[] = [];
    for (const entry of sortedJournalEntries) {
      const matchingReport = dayReports.find((report) => entry.atMs <= report.endAtMs);
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
        // Quest recap is written just before the day report; keep it above the report block.
        sortMs: report.atMs - 1,
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
  const questCardRows = useMemo(() => {
    const incomplete = visibleQuests.filter((q) => !completedQuestIdSet.has(q.id));
    if (
      activeQuest &&
      !completedQuestIdSet.has(activeQuest.id) &&
      !incomplete.some((q) => q.id === activeQuest.id)
    ) {
      return [activeQuest, ...incomplete];
    }
    return incomplete;
  }, [visibleQuests, completedQuestIdSet, activeQuest]);

  const hasOpenedOriginQuest = playerFlags.includes(ORIGIN_QUEST_OPENED_FLAG);
  const resolveQuestBriefing = (questId: string, defaultBriefing: string): string =>
    questId === 'quest-001-origin' && hasOpenedOriginQuest
      ? 'Welcome to No Stranger Game'
      : defaultBriefing;

  const showActiveStateCard =
    questCardRows.length === 0 && Boolean(activeJobSlug) && skills !== undefined;

  const locationActionsBlock =
    visibleLocationActions.length > 0 ? (
      <div className="space-y-1.5 border-t border-[var(--candle-rule)] pt-2">
        <ul className={RPG_CHOICE_GRID}>
          {visibleLocationActions.map((action) => (
            <li key={action}>
              <button
                type="button"
                onClick={() => onLocationAction?.(action)}
                className={cn(RPG_COMMAND_CHIP, 'min-h-[var(--rpg-command-min-h)]')}
              >
                <span className={RPG_COMMAND_CHIP_LABEL}>{action}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <section className={cn('relative flex h-full min-h-0 flex-col gap-1.5', className)}>
      <div
        ref={dialogueScrollRef}
        onScroll={onDialogueScroll}
        className="facsimile-scroll min-h-0 flex-1 overflow-y-auto pr-0 [scroll-padding-bottom:min(8dvh,80px)]"
      >
        <div
          className={cn(
            'play-feed-scroll-inner facsimile-scroll-dialogue-inner space-y-1',
            '!px-[5px]'
          )}
        >
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

        </div>
      </div>

      {questCardRows.length > 0 ? (
        <div className={cn('shrink-0 space-y-1 bg-black/20 py-1.5', '!px-[5px]')}>
          {questCardRows.map((quest) => {
            const isNew = newQuestIds.includes(quest.id);
            const briefingText = resolveQuestBriefing(quest.id, quest.briefing);
            const questCardInteractive = quest.questCardInteractive !== false;
            return (
              <div key={`quest-card-${quest.id}`} className="py-0.5">
                <QuestCardHeader
                  quest={quest}
                  title={quest.title}
                  briefingText={briefingText}
                  isNew={isNew}
                  interactive={questCardInteractive}
                  onOpen={questCardInteractive ? () => onOpenQuest(quest.id) : undefined}
                  playerFlags={playerFlags}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {showActiveStateCard && activeJobSlug && skills ? (
        <div className="w-full shrink-0">
          <ActiveStateCard
            activeJobSlug={activeJobSlug}
            skills={skills}
            dayCounter={dayCounter}
            dayPacingActive={dayPacingActive}
            nextDayResetMs={nextDayResetMs}
            communityProject={communityProject}
          />
        </div>
      ) : null}

      {locationActionsBlock}
    </section>
  );
}
