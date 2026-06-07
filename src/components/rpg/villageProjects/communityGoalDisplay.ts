import { formatResourceLabel } from '../helpers';
import type { VillageProjectProgress } from './villageProjectNostr';
import type { VillageProjectResource } from './constants';

/** Banner copy framing the mayor's project as the player's village quest. */
export function formatCommunityGoalBannerText(
  progress: Pick<VillageProjectProgress, 'definition' | 'totals'>
): string | null {
  const def = progress.definition;
  if (!def) return null;

  const resourceParts = (Object.keys(def.goals) as VillageProjectResource[])
    .map((resource) => {
      const goal = def.goals[resource];
      if (!goal) return null;
      const have = progress.totals[resource] ?? 0;
      return `${formatResourceLabel(resource)} ${have}/${goal}`;
    })
    .filter((part): part is string => Boolean(part));

  if (resourceParts.length === 0) return `Active community quest — ${def.title}`;
  return `Active community quest — ${def.title} · ${resourceParts.join(' · ')}`;
}
