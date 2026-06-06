import { useMemo, useState } from 'react';
import { GamePanelDialog, GamePanelDialogTitle } from '../GamePanelDialog';
import { GamePanelExpandable } from '../GamePanelExpandable';
import { GamePanelScroll } from '../GamePanelScroll';
import { PanelUpdateButton } from '../PanelUpdateButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { GUILD_CREATE_COST_GOLD } from './guildEconomy';
import { DEFAULT_GUILD } from './defaultGuild';
import { CreateGuildNameDialog } from './CreateGuildNameDialog';
import type { GuildDefinitionView } from './defaultGuild';
import type { GuildMemberRow } from './guildNostr';
import type { useGuildAlley } from './useGuildAlley';
type GuildAlleyPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myPubkey: string | undefined;
  guildAlley: ReturnType<typeof useGuildAlley>;
};

function formatGuildDate(atSec: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(atSec * 1000));
}

function GuildListRow({
  guild,
  joinDisabled,
  joinReason,
  onJoin,
  isJoinPending,
}: {
  guild: GuildDefinitionView;
  joinDisabled: boolean;
  joinReason?: string;
  onJoin: () => void;
  isJoinPending: boolean;
}) {
  return (
    <GamePanelExpandable label={<span className="truncate">{guild.name}</span>}>
      <div className="space-y-2">
        <p className="font-serif text-xs text-[var(--candle-ink-faint)]">Leader: {guild.leaderName}</p>
        <Button
          type="button"
          size="sm"
          className="w-full font-serif text-xs uppercase tracking-[0.1em]"
          disabled={joinDisabled || isJoinPending}
          onClick={onJoin}
        >
          {isJoinPending ? 'Joining…' : 'Join'}
        </Button>
        {joinReason ? (
          <p className="text-center font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">{joinReason}</p>
        ) : null}
      </div>
    </GamePanelExpandable>
  );
}

function GuildMembersTab({
  guild,
  members,
  canLeave,
  onElectLeader,
  onLeave,
  isLeavePending,
}: {
  guild: GuildDefinitionView;
  members: GuildMemberRow[];
  canLeave: boolean;
  onElectLeader: () => void;
  onLeave: () => void;
  isLeavePending: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0 space-y-1 rounded-md border border-[var(--candle-rule)]/80 bg-black/25 px-3 py-2">
        <p className="font-serif text-sm text-[var(--candle-wax)]">Leader: {guild.leaderName}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2">
        <p className="font-serif text-[0.65rem] uppercase tracking-[0.14em] text-[var(--candle-ink-faint)]">Members</p>
        <GamePanelScroll className="h-[min(40vh,16rem)] rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
          <ul className="space-y-2 p-2">
            {members.length === 0 ? (
              <li className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">No members yet.</li>
            ) : (
              members.map((m) => (
                <li
                  key={m.pubkey}
                  className={cn(
                    'font-serif text-sm text-[var(--candle-ink-soft)]',
                    m.status === 'left' && 'text-[var(--candle-ink-faint)]'
                  )}
                >
                  {m.status === 'left' ? (
                    <>
                      <span className="line-through">{m.name}</span>
                      {' — Left on '}
                      {formatGuildDate(m.leftAtSec ?? m.joinedAtSec)}
                    </>
                  ) : (
                    <>
                      {m.name}
                      {' — joined '}
                      {formatGuildDate(m.joinedAtSec)}
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </GamePanelScroll>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="flex-1 font-serif text-xs uppercase tracking-[0.08em]"
          onClick={onElectLeader}
        >
          Elect new leader
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 font-serif text-xs uppercase tracking-[0.08em]"
          disabled={!canLeave || isLeavePending}
          onClick={onLeave}
        >
          {isLeavePending ? 'Leaving…' : 'Leave Guild'}
        </Button>
      </div>
    </div>
  );
}

export function GuildAlleyContent({
  myPubkey,
  guildAlley,
  embedded = false,
}: {
  myPubkey: string | undefined;
  guildAlley: ReturnType<typeof useGuildAlley>;
  embedded?: boolean;
}) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('alley');

  const {
    feed,
    feedQuery,
    membership,
    hasActiveMembership,
    myActiveMembershipSlug,
    canAffordCreate,
    joinGuild,
    leaveGuild,
    createGuild,
    refreshFeed,
  } = guildAlley;

  const memberGuildDef = useMemo(() => {
    if (!membership) return null;
    return (
      feed.guilds.find((g) => g.slug === membership.guildSlug) ??
      (membership.guildSlug === DEFAULT_GUILD.slug
        ? DEFAULT_GUILD
        : {
            slug: membership.guildSlug,
            name: membership.guildName,
            leaderName: 'Unknown',
          })
    );
  }, [feed.guilds, membership]);

  const guildTabSlug = memberGuildDef?.slug ?? null;
  const guildTabMembers = guildTabSlug ? (feed.membersBySlug[guildTabSlug] ?? []) : [];

  const joinError =
    joinGuild.error instanceof Error
      ? joinGuild.error.message
      : createGuild.error instanceof Error
        ? createGuild.error.message
        : null;

  const handleCreateClick = () => {
    if (!canAffordCreate) {
      toast({
        title: 'Not enough gold',
        description: `Creating a guild costs ${GUILD_CREATE_COST_GOLD} gold.`,
      });
      return;
    }
    setCreateDialogOpen(true);
  };

  const tabValues = useMemo(() => {
    const tabs: Array<{ value: string; label: string }> = [{ value: 'alley', label: 'Guild Alley' }];
    if (membership && memberGuildDef) {
      tabs.push({ value: `guild-${memberGuildDef.slug}`, label: membership.guildName });
    }
    return tabs;
  }, [membership, memberGuildDef]);

  return (
    <>
      <div className={cn('flex min-h-0 flex-col gap-2 overflow-hidden', embedded ? '' : 'flex-1 px-1')}>
        <div
          className={cn(
            'grid h-auto w-full shrink-0 gap-1 rounded-md border border-[var(--candle-rule)] bg-black/30 p-1',
            tabValues.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
          )}
        >
          {tabValues.map((t) => (
            <button
              key={t.value}
              type="button"
              className={cn(
                'truncate rounded-sm px-2 py-1.5 font-serif text-[0.65rem] uppercase tracking-[0.1em] sm:text-xs',
                activeTab === t.value
                  ? 'bg-[var(--candle-flame)]/15 text-[var(--candle-wax)]'
                  : 'text-[var(--candle-ink-soft)]'
              )}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'alley' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <PanelUpdateButton
              label="Update guilds"
              onClick={() => refreshFeed()}
              isFetching={feedQuery.isFetching}
              showLedgerHint={!feedQuery.isFetched}
            />
            <GamePanelScroll
              className={cn(
                'min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20',
                embedded && 'max-h-[min(36vh,280px)]'
              )}
            >
              <div className="space-y-2 p-2">
                {feedQuery.isFetching ? (
                  <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                    Updating…
                  </p>
                ) : !feedQuery.isFetched ? (
                  <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                    Tap Update guilds to load guild roster from the village ledger.
                  </p>
                ) : (
                  feed.guilds.map((guild) => {
                    const members = feed.membersBySlug[guild.slug] ?? [];
                    const iAmActive = myPubkey
                      ? members.some((m) => m.pubkey === myPubkey && m.status === 'active')
                      : false;
                    const joinDisabled =
                      !myPubkey ||
                      (hasActiveMembership && myActiveMembershipSlug !== guild.slug) ||
                      iAmActive;
                    let joinReason: string | undefined;
                    if (hasActiveMembership && myActiveMembershipSlug !== guild.slug) {
                      joinReason = 'Leave your current guild first.';
                    } else if (iAmActive) {
                      joinReason = 'You are already a member.';
                    }

                    return (
                      <GuildListRow
                        key={guild.slug}
                        guild={guild}
                        joinDisabled={joinDisabled}
                        joinReason={joinReason}
                        isJoinPending={joinGuild.isPending}
                        onJoin={() =>
                          joinGuild.mutate(guild, {
                            onSuccess: () => setActiveTab(`guild-${guild.slug}`),
                            onError: (err) =>
                              toast({
                                title: 'Could not join',
                                description: err instanceof Error ? err.message : 'Try again.',
                              }),
                          })
                        }
                      />
                    );
                  })
                )}
              </div>
            </GamePanelScroll>

            {joinError ? (
              <p className="shrink-0 text-center font-serif text-xs text-red-300/90">{joinError}</p>
            ) : null}

            <Button
              type="button"
              className="shrink-0 font-serif uppercase tracking-[0.1em]"
              disabled={!myPubkey || !canAffordCreate || createGuild.isPending}
              onClick={handleCreateClick}
            >
              Create Guild ({GUILD_CREATE_COST_GOLD}G)
            </Button>
            {!canAffordCreate ? (
              <p className="text-center font-serif text-[0.65rem] text-[var(--candle-ink-faint)]">
                Need {GUILD_CREATE_COST_GOLD} gold to found a guild.
              </p>
            ) : null}
          </div>
        ) : membership && memberGuildDef ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <GuildMembersTab
              guild={memberGuildDef}
              members={guildTabMembers}
              canLeave={hasActiveMembership && membership.guildSlug === memberGuildDef.slug}
              onElectLeader={() =>
                toast({ title: 'Elect new leader', description: 'Not implemented yet.' })
              }
              onLeave={() =>
                leaveGuild.mutate(undefined, {
                  onError: (err) =>
                    toast({
                      title: 'Could not leave',
                      description: err instanceof Error ? err.message : 'Try again.',
                    }),
                })
              }
              isLeavePending={leaveGuild.isPending}
            />
          </div>
        ) : null}
      </div>

      <CreateGuildNameDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        isPending={createGuild.isPending}
        onSubmit={(name) =>
          createGuild.mutate(name, {
            onSuccess: (created) => {
              setCreateDialogOpen(false);
              setActiveTab(`guild-${created.slug}`);
              toast({ title: 'Guild founded', description: `${created.name} has been created.` });
            },
            onError: (err) =>
              toast({
                title: 'Could not create guild',
                description: err instanceof Error ? err.message : 'Try again.',
              }),
          })
        }
      />
    </>
  );
}

export function GuildAlleyPanel({ open, onOpenChange, myPubkey, guildAlley }: GuildAlleyPanelProps) {
  return (
    <GamePanelDialog open={open} onOpenChange={onOpenChange} ariaLabel="Guild Alley" panelClassName="gap-0 p-4 pt-8">
      <GamePanelDialogTitle className="px-2">Guild Alley</GamePanelDialogTitle>
      <GuildAlleyContent myPubkey={myPubkey} guildAlley={guildAlley} />
    </GamePanelDialog>
  );
}
