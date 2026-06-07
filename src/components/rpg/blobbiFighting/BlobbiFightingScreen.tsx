import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { GamePanelExpandable } from '../GamePanelExpandable';
import { VillageLocationScreen } from '../village/VillageLocationScreen';
import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_CAPTION,
} from '../typography/rpgUiTypography';
import { pubkeysEqual } from '@/lib/nostrPubkey';
import { computeBlobbiArenaRecord } from './blobbiCareerNostr';
import { BlobbiProfileCard } from './BlobbiProfileCard';
import { FightMatchSummary, FightMatchVersusLabel } from './FightMatchDisplay';
import {
  matchInvolvesOwner,
  myFighterInMatch,
  type BlobbiFightMatchResult,
  type BlobbiFightOpenRegistration,
} from './blobbiFightNostr';
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

function BracketRow({
  match,
  defaultOpen,
  myPubkey,
  myBlobbi,
}: {
  match?: BlobbiFightMatchResult;
  defaultOpen?: boolean;
  myPubkey?: string;
  myBlobbi?: BlobbiSnapshot;
}) {
  const myBlobbiId =
    match && myPubkey && matchInvolvesOwner(match, myPubkey)
      ? myFighterInMatch(match, myPubkey)?.blobbiId
      : undefined;
  const showFightLink = Boolean(match && myBlobbiId);

  const label = match ? (
    <FightMatchVersusLabel match={match} myBlobbi={myBlobbi} />
  ) : (
    <span className={cn(RPG_UI_CAPTION, 'truncate')}>Waiting…</span>
  );

  return (
    <GamePanelExpandable
      label={label}
      defaultOpen={defaultOpen}
      triggerClassName="px-2 py-1 text-xs"
      className="border-[var(--candle-rule)]/50"
    >
      {match ? (
        <FightMatchSummary match={match} myBlobbi={myBlobbi} showFightLink={showFightLink} />
      ) : (
        <p className={RPG_UI_CAPTION}>Waiting…</p>
      )}
    </GamePanelExpandable>
  );
}

function fightBoardRows(
  openRegistrations: readonly BlobbiFightOpenRegistration[],
  matches: readonly BlobbiFightMatchResult[]
): Array<{ key: string; label: string; match?: BlobbiFightMatchResult }> {
  const rows: Array<{ key: string; label: string; match?: BlobbiFightMatchResult }> = [];
  const matchedRegistrationIds = new Set(matches.map((m) => m.registrationEventId));

  for (const m of matches) {
    rows.push({
      key: m.eventId,
      label: `${m.fighterA.blobbiName} vs ${m.fighterB.blobbiName}`,
      match: m,
    });
  }

  for (const open of openRegistrations) {
    if (matchedRegistrationIds.has(open.eventId)) continue;
    rows.push({
      key: open.eventId,
      label: `${open.blobbiName} · ${open.ownerName} (queue)`,
    });
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
  const { blobbis, query: blobbisQuery } = playerBlobbis;
  const { feed, feedQuery, register, refreshFeed, isResolvingMatch } = blobbiFight;
  const { memories } = blobbiFightMemories;

  const myBlobbi = blobbis[0];

  const arenaRecord = useMemo(() => {
    if (!myBlobbi || !myPubkey) return { wins: 0, losses: 0 };
    return computeBlobbiArenaRecord({
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

  const rows = useMemo(
    () => fightBoardRows(feed.openRegistrations, feed.matches),
    [feed.openRegistrations, feed.matches]
  );

  const myLatestMatch = feed.myLatestMatch;
  const myMatchOutcome =
    myLatestMatch && myPubkey
      ? pubkeysEqual(myLatestMatch.winnerOwnerPubkey, myPubkey)
        ? 'won'
        : 'lost'
      : null;

  const statusLine = (() => {
    if (registerError) return registerError;
    if (isResolvingMatch) return 'Pairing fighters…';
    if (register.isPending) return 'Joining queue…';
    if (register.isSuccess && register.data?.action === 'matched') {
      return 'Match found — tap Update fights to refresh the board.';
    }
    if (feed.myOpen || (register.isSuccess && register.data?.action === 'queued')) {
      return 'In queue — tap Update when another fighter is waiting.';
    }
    if (!feedQuery.isFetched) return 'Tap Update to load fights from relays.';
    return null;
  })();

  const boardEmpty = !feedQuery.isFetching && rows.length === 0;
  const boardMessage = feedQuery.isFetching
    ? 'Loading…'
    : !feedQuery.isFetched
      ? 'Tap Update below.'
      : 'No fights yet. Tap Find match.';

  return (
    <VillageLocationScreen
      panel="blobbiFighting"
      className={className}
      onClose={onClose}
      footer={
        <>
          <li>
            <button
              type="button"
              className={RPG_COMMAND_CHIP}
              disabled={
                !myPubkey ||
                !myBlobbi ||
                register.isPending ||
                isResolvingMatch ||
                Boolean(feed.myOpen)
              }
              onClick={() => {
                if (myBlobbi) register.mutate(myBlobbi);
              }}
            >
              <span className={RPG_COMMAND_CHIP_LABEL}>
                {feed.myOpen ? 'Waiting…' : 'Find match'}
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={RPG_COMMAND_CHIP}
              disabled={feedQuery.isFetching || isResolvingMatch}
              onClick={() => void refreshFeed()}
            >
              <span className={RPG_COMMAND_CHIP_LABEL}>
                {feedQuery.isFetching || isResolvingMatch ? 'Updating…' : 'Update fights'}
              </span>
            </button>
          </li>
        </>
      }
    >
      {blobbisQuery.isPending ? (
        <p className={cn(RPG_UI_CAPTION, 'text-center')}>Loading Blobbi…</p>
      ) : null}
      {!blobbisQuery.isPending && !myBlobbi ? (
        <p className={cn(RPG_UI_CAPTION, 'text-center leading-snug')}>No Blobbis on Ditto yet.</p>
      ) : null}
      {myBlobbi ? (
        <div className="px-0.5">
          <BlobbiProfileCard blobbi={myBlobbi} arenaRecord={arenaRecord} />
        </div>
      ) : null}

      {statusLine ? (
        <p
          className={cn(
            RPG_UI_CAPTION,
            'text-center leading-snug',
            registerError ? 'text-red-300/90' : undefined
          )}
        >
          {statusLine}
        </p>
      ) : null}

      {myLatestMatch && !feed.myOpen && myMatchOutcome ? (
        <div className="text-center">
          <p className={RPG_UI_CAPTION}>
            <span className="text-[var(--candle-ink-soft)]">
              {myMatchOutcome === 'won' ? 'Victory' : 'Defeat'}
            </span>
          </p>
          <FightMatchSummary
            match={myLatestMatch}
            myBlobbi={myBlobbi}
            showFightLink={Boolean(myPubkey && matchInvolvesOwner(myLatestMatch, myPubkey))}
          />
        </div>
      ) : null}

      <div className="space-y-0.5">
        <p className={cn(RPG_UI_CAPTION, 'uppercase tracking-[0.14em]')}>Fight board</p>
        <div className="space-y-1 rounded border border-[var(--candle-rule)]/60 bg-black/20 p-1">
          {boardEmpty ? (
            <p className={cn(RPG_UI_CAPTION, 'py-2 text-center')}>{boardMessage}</p>
          ) : null}
          {rows.map((row, i) =>
            row.match ? (
              <BracketRow
                key={row.key}
                match={row.match}
                defaultOpen={i === 0}
                myPubkey={myPubkey}
                myBlobbi={myBlobbi}
              />
            ) : (
              <GamePanelExpandable
                key={row.key}
                label={<span className={cn(RPG_UI_CAPTION, 'truncate')}>{row.label}</span>}
                defaultOpen={i === 0}
                triggerClassName="px-2 py-1 text-xs"
                className="border-[var(--candle-rule)]/50"
              >
                <p className={RPG_UI_CAPTION}>Waiting…</p>
              </GamePanelExpandable>
            )
          )}
        </div>
      </div>
    </VillageLocationScreen>
  );
}
