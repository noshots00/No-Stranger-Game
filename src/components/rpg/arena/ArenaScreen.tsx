import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { VillageLocationScreen } from '../village/VillageLocationScreen';
import {
  RPG_COMMAND_CHIP,
  RPG_COMMAND_CHIP_LABEL,
  RPG_UI_CAPTION,
  RPG_UI_META,
} from '../typography/rpgUiTypography';
import { ArenaFightWatchView } from './ArenaFightWatchView';
import { ArenaTrainerTalkView } from './ArenaTrainerTalk';
import {
  TRAINER_ATTACK_LABEL,
  TRAINER_LEAVE_LABEL,
} from './arenaTrainerDialogueTree';
import { useArenaTrainerTalk } from './useArenaTrainerTalk';
import { ArenaFightCard } from './ArenaFightCard';
import { formatFighterIdentitySubtitle } from './arenaDisplay';
import { buildArenaFighterSnapshot } from './arenaCombat';
import type { FighterSnapshot } from '../combat/combatTypes';
import {
  formatArenaFightLine,
  createEmptyArenaRecord,
  buildHeadToHeadWinCountsByMatchId,
  type HeadToHeadWins,
} from './arenaRecord';
import type { ArenaMatchResult, ArenaOpenRegistration } from './arenaNostr';
import type { ArenaMatchPayloadV1 } from './arenaCombat';
import type { useArenaTournament } from './useArenaTournament';
import { useArenaFightReplay } from './useArenaFightReplay';
import type { ArenaRecord, ArenaFightRecord, QuestState } from '../quests/types';
import { CHAR_SUBTITLE } from '../tabs/characterSheetTypography';

type ArenaScreenProps = {
  className?: string;
  onClose: () => void;
  questState: QuestState;
  myPubkey: string | undefined;
  tournament: ReturnType<typeof useArenaTournament>;
  onPlayerHealthChange?: (health: number) => void;
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
      aria-label={expanded ? `Hide ${name} fight card` : `Show ${name} fight card`}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

function MatchTitle({
  match,
  headToHeadWins,
  expandedPubkey,
  onToggleFighter,
}: {
  match: ArenaMatchResult;
  headToHeadWins: HeadToHeadWins;
  expandedPubkey: string | null;
  onToggleFighter: (pubkey: string) => void;
}) {
  const { fighterA, fighterB, winnerPubkey, matchPayload } = match;
  const winsA = headToHeadWins[fighterA.pubkey] ?? 0;
  const winsB = headToHeadWins[fighterB.pubkey] ?? 0;
  const canExpand = Boolean(matchPayload);

  return (
    <>
      <FighterNameButton
        name={fighterA.name}
        wins={winsA}
        wonThisMatch={winnerPubkey === fighterA.pubkey}
        canExpand={canExpand}
        expanded={expandedPubkey === fighterA.pubkey}
        onToggle={canExpand ? () => onToggleFighter(fighterA.pubkey) : undefined}
      />
      <span className="text-[var(--candle-ink-faint)]"> vs </span>
      <FighterNameButton
        name={fighterB.name}
        wins={winsB}
        wonThisMatch={winnerPubkey === fighterB.pubkey}
        canExpand={canExpand}
        expanded={expandedPubkey === fighterB.pubkey}
        onToggle={canExpand ? () => onToggleFighter(fighterB.pubkey) : undefined}
      />
    </>
  );
}

function fighterCardFromPayload(
  payload: ArenaMatchPayloadV1,
  pubkey: string
): { fighter: FighterSnapshot; currentHp?: number } | null {
  const fighter =
    payload.fighterA.pubkey === pubkey || payload.fighterA.id === pubkey
      ? payload.fighterA
      : payload.fighterB.pubkey === pubkey || payload.fighterB.id === pubkey
        ? payload.fighterB
        : null;
  if (!fighter) return null;
  return { fighter, currentHp: payload.finalHp[fighter.id] };
}

function TournamentRow({
  match,
  openRegistration,
  headToHeadWins,
  onWatch,
}: {
  match?: ArenaMatchResult;
  openRegistration?: ArenaOpenRegistration;
  headToHeadWins?: HeadToHeadWins;
  onWatch?: () => void;
}) {
  const [expandedPubkey, setExpandedPubkey] = useState<string | null>(null);
  const [waitingCardOpen, setWaitingCardOpen] = useState(false);
  const payload = match?.matchPayload;

  const toggleFighter = (pubkey: string) => {
    setExpandedPubkey((prev) => (prev === pubkey ? null : pubkey));
  };

  if (match) {
    const expandedCard =
      expandedPubkey && payload ? fighterCardFromPayload(payload, expandedPubkey) : null;

    return (
      <li className="py-0.5">
        <div className="flex items-center gap-1">
          <p className="rpg-font-ui min-w-0 flex-1 truncate text-[12px] leading-tight text-[var(--candle-ink-soft)]">
            <MatchTitle
              match={match}
              headToHeadWins={headToHeadWins ?? {}}
              expandedPubkey={expandedPubkey}
              onToggleFighter={toggleFighter}
            />
          </p>
          {payload && onWatch ? (
            <button
              type="button"
              className={cn(RPG_COMMAND_CHIP, 'h-6 shrink-0 px-2 py-0')}
              onClick={onWatch}
            >
              <span className={cn(RPG_COMMAND_CHIP_LABEL, 'text-[10px]')}>Watch</span>
            </button>
          ) : null}
        </div>
        {expandedCard ? (
          <div className="pb-1 pt-0.5">
            <ArenaFightCard fighter={expandedCard.fighter} currentHp={expandedCard.currentHp} />
          </div>
        ) : null}
      </li>
    );
  }

  if (openRegistration) {
    const fighter = openRegistration.fighterSnapshot;

    return (
      <li className="py-0.5">
        <p className="rpg-font-ui min-w-0 truncate text-[12px] leading-tight text-[var(--candle-ink-soft)]">
          <FighterNameButton
            name={openRegistration.name}
            canExpand={Boolean(fighter)}
            expanded={waitingCardOpen}
            onToggle={fighter ? () => setWaitingCardOpen((open) => !open) : undefined}
          />
          <span className="text-[var(--candle-wax)]"> (waiting…)</span>
        </p>
        {waitingCardOpen && fighter ? (
          <div className="pb-1 pt-0.5">
            <ArenaFightCard fighter={fighter} />
          </div>
        ) : null}
      </li>
    );
  }

  return null;
}

function MyQueueRow({
  myPubkey,
  questState,
  openRegistration,
}: {
  myPubkey: string;
  questState: QuestState;
  openRegistration: ArenaOpenRegistration;
}) {
  const [cardOpen, setCardOpen] = useState(false);
  const fighter =
    openRegistration.fighterSnapshot ?? buildArenaFighterSnapshot(questState, myPubkey);
  const arenaRecord = questState.arenaRecord ?? createEmptyArenaRecord();

  return (
    <li className="relative border-b border-[var(--candle-rule)]/25 py-1.5">
      <span className="absolute right-0 top-1.5 max-w-[7rem] text-right rpg-font-ui text-[9px] leading-tight tracking-[0.06em] text-emerald-400/95">
        Waiting for opponent
      </span>
      <div className="min-w-0 pr-[7.5rem]">
        <p className="min-w-0 truncate leading-tight">
          <FighterNameButton
            name={fighter.name}
            canExpand
            prominent
            expanded={cardOpen}
            onToggle={() => setCardOpen((open) => !open)}
          />
          <span className={cn(CHAR_SUBTITLE, 'text-[var(--candle-ink-soft)]')}>
            <span className="text-[var(--candle-ink-faint)]"> · </span>
            {formatFighterIdentitySubtitle(fighter)}
            <span className="text-[var(--candle-ink-faint)]"> · </span>
            <span className="tabular-nums font-medium text-[var(--candle-wax)]">
              {arenaRecord.wins}:{arenaRecord.losses}
            </span>
          </span>
        </p>
      </div>
      {cardOpen ? (
        <div className="pb-1 pt-0.5">
          <ArenaFightCard fighter={fighter} />
        </div>
      ) : null}
    </li>
  );
}

function FightHistoryRow({ fight }: { fight: ArenaFightRecord }) {
  return (
    <li className="py-0.5">
      <p className="rpg-font-ui truncate text-[12px] leading-tight text-[var(--candle-ink-soft)]">
        {formatArenaFightLine(
          fight.won,
          fight.opponentName,
          fight.myCombatRating,
          fight.opponentCombatRating
        )}
      </p>
    </li>
  );
}

function tournamentRows(
  openRegistrations: readonly ArenaOpenRegistration[],
  matches: readonly ArenaMatchResult[],
  myPubkey: string | undefined
): Array<{ key: string; match?: ArenaMatchResult; openRegistration?: ArenaOpenRegistration }> {
  const rows: Array<{ key: string; match?: ArenaMatchResult; openRegistration?: ArenaOpenRegistration }> = [];
  const matchedRegistrationIds = new Set(matches.map((m) => m.registrationEventId));

  for (const m of matches) {
    rows.push({
      key: m.eventId,
      match: m,
    });
  }

  for (const open of openRegistrations) {
    if (matchedRegistrationIds.has(open.eventId)) continue;
    if (myPubkey && open.pubkey === myPubkey) continue;
    rows.push({
      key: open.eventId,
      openRegistration: open,
    });
  }

  return rows;
}

export function ArenaScreen({
  className,
  onClose,
  questState,
  myPubkey,
  tournament,
  onPlayerHealthChange,
}: ArenaScreenProps) {
  const [arenaTab, setArenaTab] = useState<'tournament' | 'stats'>('tournament');
  const [trainerTalkOpen, setTrainerTalkOpen] = useState(false);
  const [watchPayload, setWatchPayload] = useState<ArenaMatchPayloadV1 | null>(null);
  const arenaRecord: ArenaRecord = questState.arenaRecord ?? createEmptyArenaRecord();
  const { feed, feedQuery, register, invalidateFeed } = tournament;
  const registerError =
    register.error instanceof Error ? register.error.message : register.isError ? 'Registration failed.' : null;

  const rows = useMemo(
    () => tournamentRows(feed.openRegistrations, feed.matches, myPubkey),
    [feed.openRegistrations, feed.matches, myPubkey]
  );

  const headToHeadByMatchId = useMemo(
    () => buildHeadToHeadWinCountsByMatchId(feed.matches),
    [feed.matches]
  );

  const personalFights = arenaRecord.fights;

  const registerLabel = register.isPending
    ? 'Registering…'
    : feed.myOpen
      ? 'Waiting for opponent…'
      : 'Register for tournament';

  const trainerTalk = useArenaTrainerTalk({
    active: trainerTalkOpen,
    questState,
    onPlayerHealthChange,
    onLeave: () => setTrainerTalkOpen(false),
  });

  const fightReplay = useArenaFightReplay({
    payload: watchPayload,
    active: watchPayload !== null,
  });

  const closeFightWatch = () => {
    fightReplay.stopReplay();
    setWatchPayload(null);
  };

  return (
    <VillageLocationScreen
      panel="arena"
      className={className}
      bareBanner
      headerSlot={
        <div className="flex justify-center pt-0.5">
          <button type="button" className={RPG_COMMAND_CHIP} onClick={() => invalidateFeed()}>
            <span className={RPG_COMMAND_CHIP_LABEL}>Update arena</span>
          </button>
        </div>
      }
      onClose={onClose}
      fillViewport={trainerTalkOpen || watchPayload !== null}
      hideLeaveButton={(trainerTalkOpen && trainerTalk.isCombatMode) || watchPayload !== null}
      footer={
        watchPayload ? (
          <li>
            <button type="button" className={RPG_COMMAND_CHIP} onClick={closeFightWatch}>
              <span className={RPG_COMMAND_CHIP_LABEL}>Back to arena</span>
            </button>
          </li>
        ) : trainerTalkOpen && !trainerTalk.isCombatMode ? (
          <>
            <li>
              <button
                type="button"
                className={cn(RPG_COMMAND_CHIP, 'rpg-command-chip--danger')}
                onClick={trainerTalk.handleAttack}
              >
                <span className={RPG_COMMAND_CHIP_LABEL}>{TRAINER_ATTACK_LABEL}</span>
              </button>
            </li>
            <li>
              <button type="button" className={RPG_COMMAND_CHIP} onClick={trainerTalk.handleLeave}>
                <span className={RPG_COMMAND_CHIP_LABEL}>{TRAINER_LEAVE_LABEL}</span>
              </button>
            </li>
          </>
        ) : trainerTalkOpen ? null : (
          <>
            <li>
              <button
                type="button"
                className={RPG_COMMAND_CHIP}
                onClick={() => setTrainerTalkOpen(true)}
              >
                <span className={RPG_COMMAND_CHIP_LABEL}>Fight the Trainer</span>
              </button>
            </li>
            {arenaTab === 'tournament' ? (
              <li>
                <button
                  type="button"
                  className={RPG_COMMAND_CHIP}
                  disabled={!myPubkey || register.isPending || Boolean(feed.myOpen)}
                  onClick={() => register.mutate()}
                >
                  <span className={RPG_COMMAND_CHIP_LABEL}>{registerLabel}</span>
                </button>
              </li>
            ) : null}
          </>
        )
      }
    >
      {watchPayload ? (
        <ArenaFightWatchView {...fightReplay} className="h-full min-h-0" />
      ) : trainerTalkOpen ? (
        <ArenaTrainerTalkView {...trainerTalk} className="h-full min-h-0" />
      ) : (
        <>
          <div className="grid w-full shrink-0 grid-cols-2 gap-0.5 rounded-md bg-black/20 p-0.5">
            <button
              type="button"
              className={cn(
                RPG_UI_CAPTION,
                'rounded-sm px-1 py-0.5 uppercase tracking-[0.12em]',
                arenaTab === 'tournament'
                  ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                  : 'text-[var(--candle-ink-soft)]'
              )}
              onClick={() => setArenaTab('tournament')}
            >
              Tournament
            </button>
            <button
              type="button"
              className={cn(
                RPG_UI_CAPTION,
                'rounded-sm px-1 py-0.5 uppercase tracking-[0.12em]',
                arenaTab === 'stats'
                  ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                  : 'text-[var(--candle-ink-soft)]'
              )}
              onClick={() => setArenaTab('stats')}
            >
              Your Record
            </button>
          </div>

          <section className="space-y-1">
            {arenaTab === 'tournament' ? (
              <>
                {registerError ? (
                  <p className="text-center text-xs text-red-300/90">{registerError}</p>
                ) : null}

                <div className="rounded-md bg-black/20">
                  {feedQuery.isPending && rows.length === 0 && !feed.myOpen ? (
                    <p className={cn(RPG_UI_META, 'py-3 text-center')}>Loading tournament board…</p>
                  ) : !feedQuery.isPending && rows.length === 0 && !feed.myOpen ? (
                    <p className={cn(RPG_UI_META, 'py-3 text-center')}>
                      No fighters registered yet. Be the first to enter the queue.
                    </p>
                  ) : (
                    <ul className="list-none px-2 py-0.5">
                      {feed.myOpen && myPubkey ? (
                        <MyQueueRow
                          myPubkey={myPubkey}
                          questState={questState}
                          openRegistration={feed.myOpen}
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
                          onWatch={
                            row.match?.matchPayload
                              ? () => setWatchPayload(row.match!.matchPayload!)
                              : undefined
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
                  <p className={cn(RPG_UI_META, 'py-3 text-center')}>No arena fights yet.</p>
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
