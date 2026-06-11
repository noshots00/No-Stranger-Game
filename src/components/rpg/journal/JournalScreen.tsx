import { useMemo, type RefObject } from 'react';

import { cn } from '@/lib/utils';

import { DialogueVoiceBlock } from '../DialogueVoiceBlock';

import { SpellNameInText } from '../spells/SpellNameInText';

import type { ChronicleSegment } from '../dialogueFormat';

import type { JournalLogEntry, QuestDefinition } from '../quests/types';

import { ORIGIN_QUEST_OPENED_FLAG } from '../constants';

import { ActiveStateCard } from './ActiveStateCard';

import { CompletedQuestCard } from './CompletedQuestCard';

import { buildPlayLedgerRows } from './playLedgerRows';

import { getQuestCardRows } from './questCardRows';

import { QuestCardHeader } from './QuestCardHeader';

import type { QuestState } from '../quests/types';

import type { VillageProjectProgress } from '../villageProjects/villageProjectNostr';

import {
  RPG_CHOICE_GRID,
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
} from '../typography/rpgUiTypography';

export type JournalScreenProps = {
  playFeedSegments: ChronicleSegment[];
  playJournalLines: readonly JournalLogEntry[];
  newQuestIds: readonly string[];
  visibleQuests: QuestDefinition[];
  activeQuest?: QuestDefinition | null;
  completedQuestIds: string[];
  onOpenQuest: (questId: string) => void;
  dialogueScrollRef: RefObject<HTMLDivElement | null>;
  onDialogueScroll: () => void;
  visibleLocationActions: string[];
  playerFlags: string[];
  onLocationAction?: (actionLabel: string) => void;
  activeJobSlug?: string | null;
  skills?: QuestState['skills'];
  dayCounter?: number;
  dayPacingActive?: boolean;
  nextDayResetMs?: number | null;
  communityProject?: Pick<VillageProjectProgress, 'definition' | 'totals'> | null;
  playerName?: string;
  className?: string;
  questFirstOpenedAtMs?: Readonly<Record<string, number>>;
};

export function JournalScreen({
  playFeedSegments,
  playJournalLines,
  newQuestIds,
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
  playerName = '',
  className,
  questFirstOpenedAtMs = {},
}: JournalScreenProps) {
  const questCardRows = useMemo(
    () => getQuestCardRows(visibleQuests, completedQuestIds, activeQuest),
    [visibleQuests, completedQuestIds, activeQuest]
  );

  const questById = useMemo(() => {
    const map = new Map<string, QuestDefinition>();
    for (const quest of questCardRows) {
      map.set(quest.id, quest);
    }
    return map;
  }, [questCardRows]);

  const { interleaved, unopenedQuestIds } = useMemo(
    () => buildPlayLedgerRows(playFeedSegments, questCardRows, questFirstOpenedAtMs),
    [playFeedSegments, questCardRows, questFirstOpenedAtMs]
  );

  const completedQuestIdSet = useMemo(() => new Set(completedQuestIds), [completedQuestIds]);

  const journalByQuestId = useMemo(() => {
    const map = new Map<string, JournalLogEntry>();
    for (const entry of playJournalLines) {
      map.set(entry.questId, entry);
    }
    return map;
  }, [playJournalLines]);

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

  const showBottomDock = showActiveStateCard || visibleLocationActions.length > 0;

  const pinUnopenedQuestCardsToTop =
    playFeedSegments.length === 0 && interleaved.length === 0 && unopenedQuestIds.length > 0;

  const renderQuestCard = (quest: QuestDefinition) => {
    const isNew = newQuestIds.includes(quest.id);
    const isCompleted = completedQuestIdSet.has(quest.id);
    const briefingText = resolveQuestBriefing(quest.id, quest.briefing);
    const questCardInteractive = quest.questCardInteractive !== false;

    if (isCompleted) {
      return (
        <div key={`quest-card-${quest.id}`} className="py-0.5">
          <CompletedQuestCard
            quest={quest}
            journalEntry={journalByQuestId.get(quest.id)}
            playerName={playerName}
            playerFlags={playerFlags}
            onOpen={() => onOpenQuest(quest.id)}
          />
        </div>
      );
    }

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
  };

  const unopenedQuestCardsBlock =
    unopenedQuestIds.length > 0 ? (
      <div className="space-y-1 py-0.5">
        {unopenedQuestIds.map((questId) => {
          const quest = questById.get(questId);
          if (!quest) return null;
          return renderQuestCard(quest);
        })}
      </div>
    ) : null;

  const renderStorySegment = (segment: ChronicleSegment, idx: number, keyPrefix: string) => {
    if (segment.type === 'world') {
      const wr = segment.row;
      return (
        <div
          key={`${keyPrefix}-world-${wr.atMs}-${idx}-${wr.text.slice(0, 24)}`}
          className="dialogue-line-reveal py-0.5"
        >
          <p className="font-sans text-[0.6875rem] italic leading-snug text-[var(--candle-ember)]/80">
            <SpellNameInText text={wr.text} playerName={playerName} />
          </p>
        </div>
      );
    }

    const first = segment.lines[0];
    return (
      <div
        key={`${keyPrefix}-${segment.role}-${first?.id ?? `b-${idx}`}`}
        className="dialogue-line-reveal py-0.5"
      >
        <DialogueVoiceBlock
          presentation="play"
          role={segment.role}
          lines={segment.lines}
          playerName={playerName}
        />
      </div>
    );
  };

  return (
    <section className={cn('relative flex h-full min-h-0 flex-col', className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
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
            {pinUnopenedQuestCardsToTop ? unopenedQuestCardsBlock : null}

            {interleaved.map((row, idx) => {
              if (row.kind === 'quest_slot') {
                const quest = questById.get(row.questId);
                if (!quest) return null;
                return (
                  <div key={`quest-slot-${row.questId}-${idx}`} className="space-y-1">
                    {renderQuestCard(quest)}
                    {row.prints.map((segment, printIdx) =>
                      renderStorySegment(segment, printIdx, `quest-${row.questId}-print`)
                    )}
                  </div>
                );
              }
              return renderStorySegment(row.segment, idx, 'global');
            })}

            {pinUnopenedQuestCardsToTop ? null : unopenedQuestCardsBlock}
          </div>
        </div>
      </div>

      {showBottomDock ? (
        <div className="mt-auto shrink-0">
          {showActiveStateCard && activeJobSlug && skills ? (
            <ActiveStateCard
              activeJobSlug={activeJobSlug}
              skills={skills}
              dayCounter={dayCounter}
              dayPacingActive={dayPacingActive}
              nextDayResetMs={nextDayResetMs}
              communityProject={communityProject}
            />
          ) : null}
          {locationActionsBlock}
        </div>
      ) : null}
    </section>
  );
}
