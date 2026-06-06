import { useState } from 'react';

import { cn } from '@/lib/utils';

import { GuildAlleyContent } from '../../guild/GuildAlleyPanel';
import type { useGuildAlley } from '../../guild/useGuildAlley';
import { JobsHallContent } from '../../jobs/JobsHallPanel';
import { MayorsHutContent } from '../../mayorsHut/MayorsHutPanel';
import type { useMayorsHut } from '../../mayorsHut/useMayorsHut';
import type { QuestState } from '../../quests/types';
import { RPG_UI_CAPTION } from '../../typography/rpgUiTypography';
import { VillageProjectsContent } from '../../villageProjects/VillageProjectsPanel';
import type { useVillageProjects } from '../../villageProjects/useVillageProjects';
import { VillageLocationScreen } from '../VillageLocationScreen';

type TownHallSection = 'mayor' | 'projects' | 'jobs' | 'guild';

const SECTIONS: ReadonlyArray<{ id: TownHallSection; label: string }> = [
  { id: 'mayor', label: "Mayor's Hut" },
  { id: 'projects', label: 'Projects' },
  { id: 'jobs', label: 'Jobs Hall' },
  { id: 'guild', label: 'Guild Alley' },
];

type TownHallScreenProps = {
  className?: string;
  onClose: () => void;
  myPubkey: string | undefined;
  mayorsHut: ReturnType<typeof useMayorsHut>;
  villageProjects: ReturnType<typeof useVillageProjects>;
  guildAlley: ReturnType<typeof useGuildAlley>;
  questState: QuestState;
  onSwitchJob: (jobSlug: string) => void;
  onMayorVoteRecorded?: () => void;
  onMayorVoteRetracted?: () => void;
};

export function TownHallScreen({
  className,
  onClose,
  myPubkey,
  mayorsHut,
  villageProjects,
  guildAlley,
  questState,
  onSwitchJob,
  onMayorVoteRecorded,
  onMayorVoteRetracted,
}: TownHallScreenProps) {
  const [section, setSection] = useState<TownHallSection>('mayor');

  return (
    <VillageLocationScreen panel="townHall" className={className} onClose={onClose}>
      <div
        className="grid shrink-0 grid-cols-2 gap-0.5"
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
              RPG_UI_CAPTION,
              'rounded border px-1 py-0.5 uppercase tracking-wide transition-colors',
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
        <VillageProjectsContent
          questState={questState}
          villageProjects={villageProjects}
          embedded
        />
      ) : null}
      {section === 'jobs' ? (
        <JobsHallContent questState={questState} onSwitchJob={onSwitchJob} embedded />
      ) : null}
      {section === 'guild' ? (
        <GuildAlleyContent myPubkey={myPubkey} guildAlley={guildAlley} embedded />
      ) : null}
    </VillageLocationScreen>
  );
}
