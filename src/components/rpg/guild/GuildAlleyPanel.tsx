import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      className="rounded-md border border-[var(--candle-rule)]/80 bg-black/25"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-serif text-sm text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]">
        <span className="min-w-0 truncate">{guild.name}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 opacity-70 transition-transform', expanded && 'rotate-180')}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t border-[var(--candle-rule)]/60 px-3 py-2">
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
      </CollapsibleContent>
    </Collapsible>
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
        <ScrollArea className="h-[min(40vh,16rem)] rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
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
        </ScrollArea>
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

export function GuildAlleyPanel({ open, onOpenChange, myPubkey, guildAlley }: GuildAlleyPanelProps) {
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
  } = guildAlley;

  /** Guild tab stays available after leave so the roster can show struck-through self. */
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'flex !flex-col gap-0 overflow-hidden border border-[var(--candle-rule)] bg-[var(--candle-hearth)] p-4 pt-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
            'h-[95dvh] max-h-[95dvh] min-h-0 w-[min(95vw,430px)] max-w-none sm:rounded-lg'
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="shrink-0 space-y-1 px-4 text-center sm:text-center">
            <DialogTitle className="font-cormorant text-xl font-semibold tracking-[0.06em] text-[var(--candle-wax)]">
              Guild Alley
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-1"
          >
            <TabsList
              className={cn(
                'grid h-auto w-full shrink-0 gap-1 border border-[var(--candle-rule)] bg-black/30 p-1',
                tabValues.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
              )}
            >
              {tabValues.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="truncate font-serif text-[0.65rem] uppercase tracking-[0.1em] data-[state=active]:bg-[var(--candle-flame)]/15 sm:text-xs"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent
              value="alley"
              className="mt-0 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden outline-none data-[state=inactive]:hidden"
            >
              <ScrollArea className="min-h-0 flex-1 rounded-md border border-[var(--candle-rule)]/60 bg-black/20">
                <div className="space-y-2 p-2">
                  {feedQuery.isPending ? (
                    <p className="py-4 text-center font-serif text-sm text-[var(--candle-ink-faint)]">
                      Loading guilds…
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
              </ScrollArea>

              {joinError && activeTab === 'alley' ? (
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
            </TabsContent>

            {membership && memberGuildDef ? (
              <TabsContent
                value={`guild-${memberGuildDef.slug}`}
                className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden outline-none data-[state=inactive]:hidden"
              >
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
              </TabsContent>
            ) : null}
          </Tabs>
        </DialogContent>
      </Dialog>

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
