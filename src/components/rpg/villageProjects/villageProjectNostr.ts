import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import {
  NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND,
  NSG_VILLAGE_PROJECT_KIND,
  VILLAGE_PROJECT_ACTIVE_D_TAG,
  VILLAGE_PROJECT_COMMUNITY_TAG,
  VILLAGE_PROJECT_CONTRIBUTION_TAG,
  VILLAGE_PROJECT_DEF_TAG,
  VILLAGE_PROJECT_QUERY_LIMIT,
  type VillageProjectResource,
} from './constants';

export type VillageProjectDefinitionView = {
  projectId: string;
  title: string;
  description: string;
  goals: Partial<Record<VillageProjectResource, number>>;
  mayorPubkey: string;
  eventId: string;
  updatedAt: number;
};

export type VillageProjectContributionView = {
  contributorPubkey: string;
  contributorName: string;
  projectId: string;
  resource: VillageProjectResource;
  amount: number;
  eventId: string;
  atMs: number;
};

export type VillageProjectProgress = {
  definition: VillageProjectDefinitionView | null;
  totals: Partial<Record<VillageProjectResource, number>>;
  contributions: VillageProjectContributionView[];
};

const tagValue = (event: NostrEvent, name: string): string | undefined =>
  event.tags.find(([n]) => n === name)?.[1];

export function villageProjectDefinitionFilter(mayorPubkey: string | null): NostrFilter {
  const base: NostrFilter = {
    kinds: [NSG_VILLAGE_PROJECT_KIND],
    '#t': [VILLAGE_PROJECT_DEF_TAG],
    '#d': [VILLAGE_PROJECT_ACTIVE_D_TAG],
    limit: VILLAGE_PROJECT_QUERY_LIMIT,
  };
  if (mayorPubkey) {
    return { ...base, authors: [mayorPubkey] };
  }
  return base;
}

export function villageProjectContributionFilter(projectId: string): NostrFilter {
  return {
    kinds: [NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND],
    '#t': [VILLAGE_PROJECT_CONTRIBUTION_TAG],
    '#p': [projectId],
    limit: VILLAGE_PROJECT_QUERY_LIMIT,
  };
}

function parseGoalTags(event: NostrEvent): Partial<Record<VillageProjectResource, number>> {
  const goals: Partial<Record<VillageProjectResource, number>> = {};
  for (const [name, value] of event.tags) {
    if (name === 'goal-stone' && value) {
      const n = Number.parseInt(value, 10);
      if (Number.isFinite(n) && n > 0) goals.stone = n;
    }
    if (name === 'goal-iron' && value) {
      const n = Number.parseInt(value, 10);
      if (Number.isFinite(n) && n > 0) goals.iron = n;
    }
    if (name === 'goal-logs' && value) {
      const n = Number.parseInt(value, 10);
      if (Number.isFinite(n) && n > 0) goals.logs = n;
    }
  }
  return goals;
}

export function parseVillageProjectDefinition(event: NostrEvent): VillageProjectDefinitionView | null {
  if (event.kind !== NSG_VILLAGE_PROJECT_KIND) return null;
  if (tagValue(event, 'd') !== VILLAGE_PROJECT_ACTIVE_D_TAG) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === VILLAGE_PROJECT_DEF_TAG)) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === VILLAGE_PROJECT_COMMUNITY_TAG)) return null;

  const projectId = tagValue(event, 'project-id')?.trim();
  const title = tagValue(event, 'title')?.trim();
  if (!projectId || !title) return null;

  const description = tagValue(event, 'desc')?.trim() ?? event.content.trim();

  return {
    projectId,
    title,
    description,
    goals: parseGoalTags(event),
    mayorPubkey: event.pubkey,
    eventId: event.id,
    updatedAt: event.created_at,
  };
}

export function parseVillageProjectContribution(event: NostrEvent): VillageProjectContributionView | null {
  if (event.kind !== NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND) return null;
  if (!event.tags.some(([n, v]) => n === 't' && v === VILLAGE_PROJECT_CONTRIBUTION_TAG)) return null;

  const projectId = tagValue(event, 'p')?.trim() ?? tagValue(event, 'project-id')?.trim();
  const resourceRaw = tagValue(event, 'resource')?.trim();
  const amountRaw = tagValue(event, 'amount')?.trim();
  if (!projectId || (resourceRaw !== 'stone' && resourceRaw !== 'iron' && resourceRaw !== 'logs')) return null;
  const amount = Number.parseInt(amountRaw ?? '', 10);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const contributorName = tagValue(event, 'contributor-name')?.trim() ?? 'Stranger';

  return {
    contributorPubkey: event.pubkey,
    contributorName,
    projectId,
    resource: resourceRaw,
    amount,
    eventId: event.id,
    atMs: event.created_at * 1000,
  };
}

export function buildVillageProjectProgress(
  definitionEvents: NostrEvent[],
  contributionEvents: NostrEvent[]
): VillageProjectProgress {
  const definitions = definitionEvents
    .map(parseVillageProjectDefinition)
    .filter((d): d is VillageProjectDefinitionView => d !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const definition = definitions[0] ?? null;

  const contributions = contributionEvents
    .map(parseVillageProjectContribution)
    .filter((c): c is VillageProjectContributionView => {
      if (!c) return false;
      if (!definition) return true;
      return c.projectId === definition.projectId;
    })
    .sort((a, b) => b.atMs - a.atMs);

  const totals: Partial<Record<VillageProjectResource, number>> = {};
  for (const c of contributions) {
    totals[c.resource] = (totals[c.resource] ?? 0) + c.amount;
  }

  return { definition, totals, contributions };
}

function finalizeVillageProjectProgress(
  definition: VillageProjectDefinitionView | null,
  contributions: VillageProjectContributionView[]
): VillageProjectProgress {
  const projectId = definition?.projectId;
  const scoped = projectId
    ? contributions.filter((c) => c.projectId === projectId)
    : contributions;
  const sorted = [...scoped].sort((a, b) => b.atMs - a.atMs);
  const totals: Partial<Record<VillageProjectResource, number>> = {};
  for (const c of sorted) {
    totals[c.resource] = (totals[c.resource] ?? 0) + c.amount;
  }
  return { definition, totals, contributions: sorted };
}

/** Merge relay snapshot with local optimistic rows (union by event id). */
export function mergeVillageProjectProgress(
  local: VillageProjectProgress | undefined,
  remote: VillageProjectProgress
): VillageProjectProgress {
  if (!local) return remote;

  const definition = remote.definition ?? local.definition;
  const byEventId = new Map<string, VillageProjectContributionView>();
  for (const c of remote.contributions) byEventId.set(c.eventId, c);
  for (const c of local.contributions) {
    const prev = byEventId.get(c.eventId);
    if (!prev || c.atMs >= prev.atMs) byEventId.set(c.eventId, c);
  }

  return finalizeVillageProjectProgress(definition, Array.from(byEventId.values()));
}

/** Apply a freshly published contribution to the cached progress snapshot. */
export function applyVillageProjectContributionEventToProgress(
  prev: VillageProjectProgress,
  event: NostrEvent
): VillageProjectProgress {
  const row = parseVillageProjectContribution(event);
  if (!row) return prev;
  if (prev.definition && row.projectId !== prev.definition.projectId) return prev;
  if (prev.contributions.some((c) => c.eventId === row.eventId)) return prev;

  return finalizeVillageProjectProgress(prev.definition, [...prev.contributions, row]);
}

export function buildVillageProjectDefinitionDraft(args: {
  projectId: string;
  title: string;
  description: string;
  goals: Partial<Record<VillageProjectResource, number>>;
}): Omit<NostrEvent, 'id' | 'sig' | 'pubkey' | 'created_at'> {
  const tags: string[][] = [
    ['d', VILLAGE_PROJECT_ACTIVE_D_TAG],
    ['t', VILLAGE_PROJECT_COMMUNITY_TAG],
    ['t', VILLAGE_PROJECT_DEF_TAG],
    ['project-id', args.projectId],
    ['title', args.title],
    ['alt', 'Active village community project for No Stranger Game'],
  ];
  if (args.goals.stone) tags.push(['goal-stone', String(args.goals.stone)]);
  if (args.goals.iron) tags.push(['goal-iron', String(args.goals.iron)]);
  if (args.goals.logs) tags.push(['goal-logs', String(args.goals.logs)]);
  if (args.description.trim()) tags.push(['desc', args.description.trim()]);

  return {
    kind: NSG_VILLAGE_PROJECT_KIND,
    content: args.description.trim(),
    tags,
  };
}

export function buildVillageProjectContributionDraft(args: {
  projectId: string;
  resource: VillageProjectResource;
  amount: number;
  contributorName: string;
  contributionId: string;
}): Omit<NostrEvent, 'id' | 'sig' | 'pubkey' | 'created_at'> {
  return {
    kind: NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND,
    content: '',
    tags: [
      ['d', args.contributionId],
      ['t', VILLAGE_PROJECT_COMMUNITY_TAG],
      ['t', VILLAGE_PROJECT_CONTRIBUTION_TAG],
      ['p', args.projectId],
      ['project-id', args.projectId],
      ['resource', args.resource],
      ['amount', String(args.amount)],
      ['contributor-name', args.contributorName],
      ['alt', 'Village project resource contribution for No Stranger Game'],
    ],
  };
}
