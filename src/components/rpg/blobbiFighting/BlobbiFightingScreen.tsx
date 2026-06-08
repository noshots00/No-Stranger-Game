import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { pubkeysEqual } from '@/lib/nostrPubkey';
import { VillageLocationScreen } from '../village/VillageLocationScreen';
import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_CAPTION,
  RPG_UI_META,
} from '../typography/rpgUiTypography';
import { CHAR_SUBTITLE } from '../tabs/characterSheetTypography';
import type { HeadToHeadWins } from '../arena/arenaRecord';
import { computeBlobbiArenaRecord } from './blobbiCareerNostr';
import { formatBlobbiFightLine, formatBlobbiIdentitySubtitle } from './blobbiDisplay';
import { BlobbiFightCard } from './BlobbiFightCard';
import {
  buildBlobbiHeadToHeadWinCountsByMatchId,
  buildBlobbiPersonalFights,
  type BlobbiFightRecord,
} from './blobbiRecord';
import type { BlobbiFightMatchResult, BlobbiFightOpenRegistration } from './blobbiFightNostr';
import type { BlobbiSnapshot } from './blobbiStateNostr';
import type { useBlobbiFight } from './useBlobbiFight';
import type { useBlobbiFightMemories } from './useBlobbiFightMemories';
import type { usePlayerBlobbis } from './usePlayerBlobbis';

type BlobbiFightingScreenProps = {
  className?: string;
  onClose: () => void;
  myPubkey: string | undefined;
  playerBlobbis: ReturnType<typeof usePlayerBlobbis>;
  blobbiFight: ReturnType<typeof useBlobbiFight>;
  blobbiFightMemories: ReturnType<typeof useBlobbiFightMemories>;
};

function FighterNameButton({
  name,
  wins,
  wonThisMatch,
  canExpand,
  expanded = false,
  onToggle,
  prominent = false,
}: {
  name: string;
  wins?: number;
  wonThisMatch?: boolean;
  canExpand: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  prominent?: boolean;
}) {
  const recordClass = wonThisMatch ? 'text-emerald-400/95' : 'text-red-400/90';
  const nameClass = prominent
    ? 'rpg-display text-[16px] text-[var(--candle-wax)]'
    : wonThisMatch !== undefined
      ? wonThisMatch
        ? 'font-medium text-[var(--candle-wax)]'
        : 'font-medium text-[var(--candle-ink)]'
      : 'font-medium text-[var(--candle-ink)]';
  const label = (
    <>
      <span className={nameClass}>{name}</span>
      {wins !== undefined ? <span className={cn('tabular-nums', recordClass)}> {wins}</span> : null}
    </>
  );

  if (!canExpand || !onToggle) {
    return <span className="inline">{label}</span>;
  }

  return (
    <button
      type="button"
      className={cn(
        'inline rounded-sm text-left',
        expanded && 'underline decoration-[var(--candle-flame-soft)]/55 underline-offset-2',
        'hover:text-[var(--candle-wax)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--candle-flame-soft)]'
      )}
      aria-expanded={expanded}
      aria-label={expanded ? `Hide ${name} stats` : `Show ${name} stats`}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

function MatchTitle({
  match,
  headToHeadWins,
  expandedOwnerPubkey,
  onToggleFighter,
}: {
  match: BlobbiFightMatchResult;
  headToHeadWins: HeadToHeadWins;
  expandedOwnerPubkey: string | null;
  onToggleFighter: (ownerPubkey: string) => void;
}) {
  const { fighterA, fighterB, winnerOwnerPubkey } = match;
  const winsA = headToHeadWins[fighterA.ownerPubkey] ?? 0;
  const winsB = headToHeadWins[fighterB.ownerPubkey] ?? 0;

  return (
    <>
      <FighterNameButton
        name={fighterA.blobbiName}
        wins={winsA}
        wonThisMatch={pubkeysEqual(winnerOwnerPubkey, fighterA.ownerPubkey)}
        canExpand
        expanded={expandedOwnerPubkey === fighterA.ownerPubkey}
        onToggle={() => onToggleFighter(fighterA.ownerPubkey)}
      />
      <span className="text-[var(--candle-ink-faint)]"> vs </span>
      <FighterNameButton
        name={fighterB.blobbiName}
        wins={winsB}
        wonThisMatch={pubkeysEqual(winnerOwnerPubkey, fighterB.ownerPubkey)}
        canExpand
        expanded={expandedOwnerPubkey === fighterB.ownerPubkey}
        onToggle={() => onToggleFighter(fighterB.ownerPubkey)}
      />
    </>
  );
}

function fighterFromMatch(
  match: BlobbiFightMatchResult,
  ownerPubkey: string
): BlobbiFightMatchResult['fighterA'] | null {
  if (match.fighterA.ownerPubkey === ownerPubkey) return match.fighterA;
  if (match.fighterB.ownerPubkey === ownerPubkey) return match.fighterB;
  return null;
}

function TournamentRow({
  match,
  openRegistration,
  headToHeadWins,
}: {
  match?: BlobbiFightMatchResult;
  openRegistration?: BlobbiFightOpenRegistration;
  headToHeadWins?: HeadToHeadWins;
}) {
  const [expandedOwnerPubkey, setExpandedOwnerPubkey] = useState<string | null>(null);
  const [waitingCardOpen, setWaitingCardOpen] = useState(false);

  const toggleFighter = (ownerPubkey: string) => {
    setExpandedOwnerPubkey((prev) => (prev === ownerPubkey ? null : ownerPubkey));
  };

  if (match) {
    const expandedFighter =
      expandedOwnerPubkey ? fighterFromMatch(match, expandedOwnerPubkey) : null;

    return (
      <li className="py-0.5">
        <p className="rpg-font-ui min-w-0 truncate text-[12px] leading-tight text-[var(--candle-ink-soft)]">
          <MatchTitle
            match={match}
            headToHeadWins={headToHeadWins ?? {}}
            expandedOwnerPubkey={expandedOwnerPubkey}
            onToggleFighter={toggleFighter}
          />
        </p>
        {expandedFighter ? (
          <div className="pb-1 pt-0.5">
            <BlobbiFightCard
              compact
              blobbi={{
                displayName: expandedFighter.blobbiName,
                stage: expandedFighter.stage,
                size: null,
                health: expandedFighter.health,
                hunger: 0,
                happiness: 0,
                hygiene: 0,
                energy: 0,
              }}
              ownerName={expandedFighter.ownerName}
            />
          </div>
        ) : null}
      </li>
    );
  }

  if (openRegistration) {
    return (
      <li className="py-0.5">
        <p className="rpg-font-ui min-w-0 truncate text-[12px] leading-tight text-[var(--candle-ink-soft)]">
          <FighterNameButton
            name={openRegistration.blobbiName}
            canExpand
            expanded={waitingCardOpen}
            onToggle={() => setWaitingCardOpen((open) => !open)}
          />
          <span className="text-[var(--candle-ink-faint)]"> · </span>
          <span className="text-[var(--candle-ink-soft)]">{openRegistration.ownerName}</span>
          <span className="text-[var(--candle-wax)]"> (waiting…)</span>
        </p>
        {waitingCardOpen ? (
          <div className="pb-1 pt-0.5">
            <BlobbiFightCard
              compact
              blobbi={{
                displayName: openRegistration.blobbiName,
                stage: openRegistration.stage,
                size: null,
                health: openRegistration.health,
                hunger: 0,
                happiness: 0,
                hygiene: 0,
                energy: 0,
              }}
              ownerName={openRegistration.ownerName}
            />
          </div>
        ) : null}
      </li>
    );
  }

  return null;
}

function MyQueueRow({
  myBlobbi,
  openRegistration,
  arenaRecord,
}: {
  myBlobbi: BlobbiSnapshot;
  openRegistration: BlobbiFightOpenRegistration;
  arenaRecord: { wins: number; losses: number };
}) {
  const [cardOpen, setCardOpen] = useState(false);

  return (
    <li className="relative border-b border-[var(--candle-rule)]/25 py-1.5">
      <span className="absolute right-0 top-1.5 max-w-[7rem] text-right rpg-font-ui text-[9px] leading-tight tracking-[0.06em] text-emerald-400/95">
        Waiting for opponent
      </span>
      <div className="min-w-0 pr-[7.5rem]">
        <p className="leading-tight">
          <FighterNameButton
            name={myBlobbi.displayName}
            canExpand
            prominent
            expanded={cardOpen}
            onToggle={() => setCardOpen((open) => !open)}
          />
        </p>
        <p className={cn('mt-0.5', CHAR_SUBTITLE)}>
          {formatBlobbiIdentitySubtitle({
            stage: openRegistration.stage,
            ownerName: openRegistration.ownerName,
            size: myBlobbi.size,
          })}
          <span className="text-[var(--candle-ink-faint)]"> · </span>
          <span className="tabular-nums font-medium text-[var(--candle-wax)]">
            {arenaRecord.wins}:{arenaRecord.losses}
          </span>
        </p>
      </div>
      {cardOpen ? (
        <div className="pb-1 pt-0.5">
          <BlobbiFightCard blobbi={myBlobbi} ownerName={openRegistration.ownerName} />
        </div>
      ) : null}
    </li>
  );
}

function FightHistoryRow({ fight }: { fight: BlobbiFightRecord }) {
  return (
    <li className="py-0.5">
      <p className="rpg-font-ui truncate text-[12px] leading-tight text-[var(--candle-ink-soft)]">
        {formatBlobbiFightLine(
          fight.won,
          fight.opponentName,
          fight.myHealth,
          fight.opponentHealth
        )}
      </p>
    </li>
  );
}

function pitRows(
  openRegistrations: readonly BlobbiFightOpenRegistration[],
  matches: readonly BlobbiFightMatchResult[],
  myPubkey: string | undefined
): Array<{ key: string; match?: BlobbiFightMatchResult; openRegistration?: BlobbiFightOpenRegistration }> {
  const rows: Array<{
    key: string;
    match?: BlobbiFightMatchResult;
    openRegistration?: BlobbiFightOpenRegistration;
  }> = [];
  const matchedRegistrationIds = new Set(matches.map((m) => m.registrationEventId));

  for (const m of matches) {
    rows.push({ key: m.eventId, match: m });
  }

  for (const open of openRegistrations) {
    if (matchedRegistrationIds.has(open.eventId)) continue;
    if (myPubkey && open.pubkey === myPubkey) continue;
    rows.push({ key: open.eventId, openRegistration: open });
  }

  return rows;
}

export function BlobbiFightingScreen({
  className,
  onClose,
  myPubkey,
  playerBlobbis,
  blobbiFight,
  blobbiFightMemories,
}: BlobbiFightingScreenProps) {
  const [pitTab, setPitTab] = useState<'tournament' | 'stats'>('tournament');
  const { blobbis, query: blobbisQuery } = playerBlobbis;
  const {
    feed,
    feedQuery,
    register,
    withdrawFromQueue,
    refreshFeed,
    isResolvingMatch,
    lastResolveError,
  } = blobbiFight;
  const { memories } = blobbiFightMemories;

  const myBlobbi = blobbis[0];
  const inQueue = Boolean(feed.myOpen);

  const arenaRecord = useMemo(() => {
    if (!myBlobbi || !myPubkey) return { wins: 0, losses: 0 };
    return computeBlobbiArenaRecord({
      blobbiId: myBlobbi.id,
      matches: feed.matches,
      memories,
      myPubkey,
    });
  }, [myBlobbi, myPubkey, feed.matches, memories]);

  const personalFights = useMemo(() => {
    if (!myBlobbi || !myPubkey) return [];
    return buildBlobbiPersonalFights({
      blobbiId: myBlobbi.id,
      matches: feed.matches,
      memories,
      myPubkey,
    });
  }, [myBlobbi, myPubkey, feed.matches, memories]);

  const registerError =
    register.error instanceof Error
      ? register.error.message
      : register.isError
        ? 'Matchmaking failed.'
        : null;

  const withdrawError =
    withdrawFromQueue.error instanceof Error
      ? withdrawFromQueue.error.message
      : withdrawFromQueue.isError
        ? 'Could not leave queue.'
        : null;

  const inlineError = withdrawError ?? registerError ?? lastResolveError;

  const rows = useMemo(
    () => pitRows(feed.openRegistrations, feed.matches, myPubkey),
    [feed.openRegistrations, feed.matches, myPubkey]
  );

  const headToHeadByMatchId = useMemo(
    () => buildBlobbiHeadToHeadWinCountsByMatchId(feed.matches),
    [feed.matches]
  );

  const actionBusy =
    register.isPending || withdrawFromQueue.isPending || isResolvingMatch;

  const registerLabel = register.isPending
    ? 'Joining queue…'
    : inQueue
      ? 'Waiting for opponent…'
      : 'Find match';

  const boardLoading =
    !feedQuery.isFetched && feedQuery.isFetching && rows.length === 0 && !inQueue;

  return (
    <VillageLocationScreen
      panel="blobbiFighting"
      className={className}
      bareBanner
      headerSlot={
        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            className={RPG_COMMAND_CHIP}
            disabled={feedQuery.isFetching || actionBusy}
            onClick={() => void refreshFeed()}
          >
            <span className={RPG_COMMAND_CHIP_LABEL}>
              {feedQuery.isFetching || isResolvingMatch ? 'Updating…' : 'Update fights'}
            </span>
          </button>
        </div>
      }
      onClose={onClose}
      footer={
        pitTab === 'tournament' ? (
          <>
            <li>
              {inQueue ? (
                <button
                  type="button"
                  className={RPG_COMMAND_CHIP}
                  disabled={!myPubkey || actionBusy}
                  onClick={() => void withdrawFromQueue.mutate()}
                >
                  <span className={RPG_COMMAND_CHIP_LABEL}>
                    {withdrawFromQueue.isPending ? 'Leaving…' : 'Leave queue'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className={RPG_COMMAND_CHIP}
                  disabled={!myPubkey || !myBlobbi || actionBusy}
                  onClick={() => {
                    if (myBlobbi) register.mutate(myBlobbi);
                  }}
                >
                  <span className={RPG_COMMAND_CHIP_LABEL}>{registerLabel}</span>
                </button>
              )}
            </li>
          </>
        ) : null
      }
    >
      {blobbisQuery.isPending ? (
        <p className={cn(RPG_UI_META, 'py-3 text-center')}>Loading Blobbi…</p>
      ) : !blobbisQuery.isPending && !myBlobbi ? (
        <p className={cn(RPG_UI_META, 'py-3 text-center')}>No Blobbis on Ditto yet.</p>
      ) : (
        <>
          <div className="grid w-full shrink-0 grid-cols-2 gap-0.5 rounded-md bg-black/20 p-0.5">
            <button
              type="button"
              className={cn(
                RPG_UI_CAPTION,
                'rounded-sm px-1 py-0.5 uppercase tracking-[0.12em]',
                pitTab === 'tournament'
                  ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                  : 'text-[var(--candle-ink-soft)]'
              )}
              onClick={() => setPitTab('tournament')}
            >
              Tournament
            </button>
            <button
              type="button"
              className={cn(
                RPG_UI_CAPTION,
                'rounded-sm px-1 py-0.5 uppercase tracking-[0.12em]',
                pitTab === 'stats'
                  ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                  : 'text-[var(--candle-ink-soft)]'
              )}
              onClick={() => setPitTab('stats')}
            >
              Your Record
            </button>
          </div>

          <section className="space-y-1">
            {pitTab === 'tournament' ? (
              <>
                {inlineError ? (
                  <p className="text-center text-xs text-red-300/90">{inlineError}</p>
                ) : null}

                <div className="rounded-md bg-black/20">
                  {boardLoading ? (
                    <p className={cn(RPG_UI_META, 'py-3 text-center')}>Loading fight board…</p>
                  ) : !boardLoading && rows.length === 0 && !inQueue ? (
                    <p className={cn(RPG_UI_META, 'py-3 text-center')}>
                      No fights yet. Tap Find match to enter the queue.
                    </p>
                  ) : (
                    <ul className="list-none px-2 py-0.5">
                      {inQueue && myBlobbi && feed.myOpen ? (
                        <MyQueueRow
                          myBlobbi={myBlobbi}
                          openRegistration={feed.myOpen}
                          arenaRecord={arenaRecord}
                        />
                      ) : null}
                      {rows.map((row) => (
                        <TournamentRow
                          key={row.key}
                          match={row.match}
                          openRegistration={row.openRegistration}
                          headToHeadWins={
                            row.match ? headToHeadByMatchId.get(row.match.eventId) : undefined
                          }
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-md bg-black/20">
                <p
                  className={cn(
                    RPG_UI_CAPTION,
                    'py-1.5 text-center text-[var(--candle-ink-soft)]'
                  )}
                >
                  Record{' '}
                  <span className="font-medium text-[var(--candle-wax)]">
                    {arenaRecord.wins}–{arenaRecord.losses}
                  </span>
                </p>
                {personalFights.length === 0 ? (
                  <p className={cn(RPG_UI_META, 'py-3 text-center')}>No pit fights yet.</p>
                ) : (
                  <ul className="list-none px-2 py-0.5">
                    {personalFights.map((fight) => (
                      <FightHistoryRow key={fight.matchEventId} fight={fight} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </VillageLocationScreen>
  );
}
