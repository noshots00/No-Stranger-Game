import { useEffect, useMemo, useRef, useState } from 'react';
import { nip19 } from 'nostr-tools';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { NetworkPresenceMember } from '@/lib/rpg/utils';
import type { EchoesData } from '@/hooks/useEchoes';
import type { ScryingGlimmer } from '@/hooks/useScryingPool';
import type { ConvergenceSignal } from '@/hooks/useConvergence';
import { getClassDescription, getProfessionDescription, getRaceDescription } from '@/lib/rpg/identityGlossary';
import { ResponsiveTooltip } from './ResponsiveTooltip';

interface LedgerData {
  totalStrangers: number;
  tally: Array<{ option: string; count: number }>;
}

interface ChronicleViewProps {
  latestConsequence?: string;
  hasUnreadChapter: boolean;
  onOpenChapter: () => void;
  echoes?: EchoesData;
  homelandLine?: string;
  ledger?: LedgerData;
  totalWorldOptedIn?: number;
  convergenceMatches: ConvergenceSignal[];
  topMembers: NetworkPresenceMember[];
  selectedNetworkMember: NetworkPresenceMember | null;
  onSelectNetworkMember: (member: NetworkPresenceMember | null) => void;
  glimmers: ScryingGlimmer[];
  onOpenEchoChamber: () => void;
  echoChamberEnabled: boolean;
  dailyLogs?: Array<{ tick: string; line: string }>;
  tickWindowId?: string;
  currentGold?: number;
  currentHealth?: number;
  syncFailed?: boolean;
}

export function ChronicleView({
  latestConsequence,
  hasUnreadChapter,
  onOpenChapter,
  echoes,
  homelandLine,
  ledger,
  totalWorldOptedIn,
  convergenceMatches,
  topMembers,
  selectedNetworkMember,
  onSelectNetworkMember,
  glimmers,
  onOpenEchoChamber,
  echoChamberEnabled,
  dailyLogs,
  tickWindowId,
  currentGold,
  currentHealth,
  syncFailed,
}: ChronicleViewProps) {
  const [flashConvergence, setFlashConvergence] = useState(false);
  const [seenNames, setSeenNames] = useState<Set<string>>(new Set());
  const convergenceKey = convergenceMatches.map((match) => match.pubkey).sort().join(',');
  const prevConvergenceKeyRef = useRef<string>('');

  useEffect(() => {
    if (convergenceMatches.length === 0) return;
    if (convergenceKey === prevConvergenceKeyRef.current) return;
    prevConvergenceKeyRef.current = convergenceKey;
    setFlashConvergence(true);
    const timer = setTimeout(() => setFlashConvergence(false), 1500);
    return () => clearTimeout(timer);
  }, [convergenceKey, convergenceMatches.length]);

  useEffect(() => {
    if (topMembers.length === 0) return;
    setSeenNames(new Set(topMembers.map((member) => member.pubkey)));
  }, [topMembers]);

  const shownGlimmers = useMemo(() => glimmers.slice(0, 3), [glimmers]);

  return (
      <div className="relative space-y-10 px-4 py-8 mx-auto max-w-lg">
      {flashConvergence ? (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: 'var(--ember)', animation: 'pulseRing 1.5s ease-out forwards' }}
          />
        </div>
      ) : null}

      {latestConsequence ? (
        <p className="font-cormorant text-xl leading-relaxed emerge" style={{ color: 'var(--ink)' }}>
          {latestConsequence}
        </p>
      ) : null}

      {hasUnreadChapter ? (
        <button type="button" onClick={onOpenChapter} className="w-full text-left group emerge emerge-delay-1">
          <p className="font-cormorant text-lg breathe" style={{ color: 'var(--ember)' }}>
            An unopened letter waits.
          </p>
          <p className="mt-1 text-xs opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--ink-dim)' }}>
            Your daily chapter waits in silence.
          </p>
        </button>
      ) : null}

      <div className="h-px w-16 mx-auto" style={{ background: 'var(--ink-ghost)' }} />

      {echoes?.eventsFlavorLines.map((line, index) => (
        <p
          key={line}
          className={`font-cormorant text-base italic emerge emerge-delay-${Math.min(index + 1, 5)}`}
          style={{ color: 'var(--ink-dim)' }}
        >
          {line}
        </p>
      ))}

      {homelandLine ? (
        <p className="font-cormorant text-sm emerge" style={{ color: 'var(--ink-ghost)' }}>
          {homelandLine}
        </p>
      ) : null}

      {ledger && ledger.totalStrangers > 0 ? (
        <p className="text-xs uppercase tracking-wider emerge" style={{ color: 'var(--ink-ghost)' }}>
          Of {ledger.totalStrangers} strangers, {ledger.tally[0] ? `${ledger.tally[0].count} chose ${ledger.tally[0].option}` : 'none have sealed a choice'}.
        </p>
      ) : null}

      {typeof totalWorldOptedIn === 'number' && totalWorldOptedIn > 0 ? (
        <p className="text-xs uppercase tracking-wider emerge" style={{ color: 'var(--ink-ghost)' }}>
          World census: {totalWorldOptedIn} character{totalWorldOptedIn === 1 ? '' : 's'} have entered.
        </p>
      ) : null}

      {tickWindowId ? (
        <p className="text-xs uppercase tracking-wider emerge" style={{ color: 'var(--ink-ghost)' }}>
          UTC Chronicle Day: {tickWindowId} · Gold {currentGold ?? 0} · Health {currentHealth ?? 100}
        </p>
      ) : null}

      {dailyLogs && dailyLogs.length > 0 ? (
        <div className="emerge">
          <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--ink-ghost)' }}>
            Today&apos;s Chronicle
          </p>
          <div className="space-y-2">
            {dailyLogs.slice(0, 4).map((entry, index) => (
              <p key={`${entry.tick}-${index}`} className="font-cormorant text-base md:text-sm leading-relaxed" style={{ color: 'var(--ink-dim)' }}>
                {entry.line}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {syncFailed ? (
        <p className="text-xs italic emerge" style={{ color: 'var(--crimson)' }}>
          The relays did not answer. Your choices are safe locally.
        </p>
      ) : null}

      {convergenceMatches.length > 0 ? (
        <div className="emerge" style={{ color: 'var(--ember-dim)' }}>
          <p className="font-cormorant text-base italic">
            {convergenceMatches.length === 1
              ? `${convergenceMatches[0].characterName} walks your path.`
              : `${convergenceMatches.length} strangers mirror your choices.`}
          </p>
        </div>
      ) : null}

      {topMembers.length > 0 ? (
        <div className="emerge">
          <p className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--ink-ghost)' }}>
            Souls in the Mist
          </p>
          <div className="flex flex-wrap gap-4">
            {topMembers.map((member) => (
              <button
                key={member.pubkey}
                onClick={() => onSelectNetworkMember(selectedNetworkMember?.pubkey === member.pubkey ? null : member)}
                className="group relative p-1"
                title={member.characterName}
                type="button"
              >
                <Avatar className="h-11 w-11 ring-1 ring-transparent group-hover:scale-105 transition-all duration-300" style={{ boxShadow: '0 0 0 1px transparent' }}>
                  <AvatarImage src={member.picture} alt={member.nostrName} />
                  <AvatarFallback className="text-xs" style={{ background: 'var(--surface)', color: 'var(--ink-dim)' }}>
                    {member.characterName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={seenNames.has(member.pubkey) ? '' : 'name-shimmer'} />
              </button>
            ))}
          </div>

          {selectedNetworkMember ? (
            <div className="mt-6 pl-4 border-l emerge" style={{ borderColor: 'var(--ink-ghost)' }}>
              <p className="font-cormorant text-lg" style={{ color: 'var(--ink)' }}>
                {selectedNetworkMember.characterName}
              </p>
              <p className="text-xs mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--ink-dim)' }}>
                <ResponsiveTooltip content={getRaceDescription(selectedNetworkMember.race) ?? 'No race description available yet.'}>
                  <button type="button" className="underline underline-offset-2 decoration-dotted">
                    {selectedNetworkMember.race ?? 'Unknown race'}
                  </button>
                </ResponsiveTooltip>
                <span>·</span>
                <ResponsiveTooltip content={getProfessionDescription(selectedNetworkMember.profession) ?? 'No profession description available yet.'}>
                  <button type="button" className="underline underline-offset-2 decoration-dotted">
                    {selectedNetworkMember.profession ?? 'Unknown trade'}
                  </button>
                </ResponsiveTooltip>
                <span>·</span>
                <ResponsiveTooltip content={getClassDescription(selectedNetworkMember.classLabel) ?? 'No class description available yet.'}>
                  <button type="button" className="underline underline-offset-2 decoration-dotted">
                    {selectedNetworkMember.classLabel}
                  </button>
                </ResponsiveTooltip>
              </p>
              <a
                href={`https://primal.net/p/${nip19.npubEncode(selectedNetworkMember.pubkey)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs mt-1 font-mono opacity-30 hover:opacity-60 transition-opacity"
                style={{ color: 'var(--ink-dim)' }}
              >
                {selectedNetworkMember.nostrName} ↗
              </a>
              {echoChamberEnabled ? (
                <button type="button" onClick={onOpenEchoChamber} className="mt-3 font-cormorant text-sm" style={{ color: 'var(--ember)' }}>
                  Send a whisper →
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {shownGlimmers.length > 0 ? (
        <div className="emerge">
          <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--ink-ghost)' }}>
            Distant Glimmers
          </p>
          {shownGlimmers.map((glimmer) => (
            <p key={glimmer.locationId} className="font-cormorant text-sm flicker" style={{ color: 'var(--mist)' }}>
              {glimmer.locationId} shimmers beyond your reach.
            </p>
          ))}
        </div>
      ) : null}
      </div>
  );
}
