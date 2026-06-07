import { useEffect } from 'react';

export type TownHallSection = 'mayor' | 'projects' | 'jobs' | 'guild';

/** One manual feed refresh when a ledger-backed Town Hall tab is selected. */
export function useTownHallSectionFeed(
  section: TownHallSection,
  feeds: {
    villageProjects: { refreshFeed: () => void };
    guildAlley: { refreshFeed: () => void };
  },
  options?: { active?: boolean }
) {
  const { refreshFeed: refreshProjects } = feeds.villageProjects;
  const { refreshFeed: refreshGuild } = feeds.guildAlley;
  const active = options?.active ?? true;

  useEffect(() => {
    if (!active) return;
    if (section === 'projects') {
      refreshProjects();
    } else if (section === 'guild') {
      refreshGuild();
    }
  }, [active, section, refreshProjects, refreshGuild]);
}
