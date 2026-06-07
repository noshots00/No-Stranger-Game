import { useState } from 'react';

import { cn } from '@/lib/utils';

import { GuildAlleyContent } from '../../guild/GuildAlleyPanel';
import type { useGuildAlley } from '../../guild/useGuildAlley';
import { GamePanelDialog, GamePanelDialogTitle } from '../../GamePanelDialog';
import { GamePanelScroll } from '../../GamePanelScroll';
import { JobsHallContent } from '../../jobs/JobsHallPanel';
import { MayorsHutContent } from '../../mayorsHut/MayorsHutPanel';
import type { useMayorsHut } from '../../mayorsHut/useMayorsHut';
import type { QuestState } from '../../quests/types';
import { VillageProjectsContent } from '../../villageProjects/VillageProjectsPanel';
import type { useVillageProjects } from '../../villageProjects/useVillageProjects';
import { useTownHallSectionFeed, type TownHallSection } from './useTownHallSectionFeed';

const SECTIONS: ReadonlyArray<{ id: TownHallSection; label: string }> = [
  { id: 'mayor', label: "Mayor's Hut" },
  { id: 'projects', label: 'Projects' },
  { id: 'jobs', label: 'Jobs Hall' },
  { id: 'guild', label: 'Guild Alley' },
];

type TownHallPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myPubkey: string | undefined;
  mayorsHut: ReturnType<typeof useMayorsHut>;
  villageProjects: ReturnType<typeof useVillageProjects>;
  guildAlley: ReturnType<typeof useGuildAlley>;
  questState: QuestState;
  onSwitchJob: (jobSlug: string) => void;
  onMayorVoteRecorded?: (candidateName: string) => void;
  onMayorVoteRetracted?: () => void;
};

export function TownHallPanel({
  open,
  onOpenChange,
  myPubkey,
  mayorsHut,
  villageProjects,
  guildAlley,
  questState,
  onSwitchJob,
  onMayorVoteRecorded,
  onMayorVoteRetracted,
}: TownHallPanelProps) {
  const [section, setSection] = useState<TownHallSection>('mayor');

  useTownHallSectionFeed(section, { villageProjects, guildAlley }, { active: open });

  return (
    <GamePanelDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Town Hall"
      panelClassName="h-auto max-h-[min(90vh,640px)] gap-2"
    >
      <GamePanelDialogTitle>Town Hall</GamePanelDialogTitle>

      <div
        className="grid shrink-0 grid-cols-2 gap-1 px-1"
        role="tablist"
        aria-label="Town Hall services"
      >
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            className={cn(
              'min-h-[var(--rpg-command-min-h)] rounded border px-1 py-1 font-serif text-[0.6875rem] leading-tight tracking-wide transition-colors',
              section === id
                ? 'border-[var(--candle-flame-soft)]/50 bg-black/35 text-[var(--candle-wax)]'
                : 'border-[var(--candle-rule)]/60 bg-black/20 text-[var(--candle-ink-soft)] hover:text-[var(--candle-wax)]'
            )}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <GamePanelScroll className="min-h-0 flex-1 pr-3">
        {section === 'mayor' ? (
          <MayorsHutContent
            myPubkey={myPubkey}
            mayorsHut={mayorsHut}
            embedded
            onVoteRecorded={onMayorVoteRecorded}
            onVoteRetracted={onMayorVoteRetracted}
          />
        ) : null}
        {section === 'projects' ? (
          <VillageProjectsContent questState={questState} villageProjects={villageProjects} />
        ) : null}
        {section === 'jobs' ? (
          <JobsHallContent questState={questState} onSwitchJob={onSwitchJob} />
        ) : null}
        {section === 'guild' ? (
          <GuildAlleyContent myPubkey={myPubkey} guildAlley={guildAlley} embedded />
        ) : null}
      </GamePanelScroll>
    </GamePanelDialog>
  );
}
