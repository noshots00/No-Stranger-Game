import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { QuestState } from '../quests/types';
import type { MayorElectionSnapshot } from '../mayorsHut/mayorElectionNostr';
import {
  VILLAGE_PROJECT_CATALOG,
  VILLAGE_PROJECT_FEED_STALE_MS,
  type VillageProjectResource,
} from './constants';
import {
  buildVillageProjectContributionDraft,
  buildVillageProjectDefinitionDraft,
  buildVillageProjectProgress,
  villageProjectContributionFilter,
  villageProjectDefinitionFilter,
} from './villageProjectNostr';

const VILLAGE_PROJECTS_FEED_KEY = ['village-projects'] as const;

export function useVillageProjects(args: {
  enabled: boolean;
  questState: QuestState;
  myPubkey: string | undefined;
  election: MayorElectionSnapshot;
  setQuestState: Dispatch<SetStateAction<QuestState>>;
  persistQuestCheckpoint: (state: QuestState) => void | Promise<void>;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const mayorPubkey = args.election.isPlaceholderMayor ? null : args.election.mayorPubkey;
  const isMayor = Boolean(args.myPubkey && mayorPubkey && args.myPubkey === mayorPubkey);

  const feedQuery = useQuery({
    queryKey: [...VILLAGE_PROJECTS_FEED_KEY, mayorPubkey ?? 'none'],
    queryFn: async () => {
      const defEvents = (await nostr.query([
        villageProjectDefinitionFilter(mayorPubkey),
      ])) as NostrEvent[];
      const progress = buildVillageProjectProgress(defEvents, []);
      const projectId = progress.definition?.projectId ?? null;
      if (!projectId) return progress;
      const contributionEvents = (await nostr.query([
        villageProjectContributionFilter(projectId),
      ])) as NostrEvent[];
      return buildVillageProjectProgress(defEvents, contributionEvents);
    },
    enabled: args.enabled,
    staleTime: VILLAGE_PROJECT_FEED_STALE_MS,
    refetchInterval: args.enabled ? VILLAGE_PROJECT_FEED_STALE_MS : false,
  });

  const progress = feedQuery.data ?? buildVillageProjectProgress([], []);
  const displayName = args.questState.playerName.trim() || 'Stranger';

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: VILLAGE_PROJECTS_FEED_KEY });
  }, [queryClient]);

  const catalogById = useMemo(() => {
    const m = new Map<string, (typeof VILLAGE_PROJECT_CATALOG)[number]>();
    for (const row of VILLAGE_PROJECT_CATALOG) m.set(row.id, row);
    return m;
  }, []);

  const setActiveProject = useMutation({
    mutationFn: async (projectId: string) => {
      if (!isMayor) throw new Error('Only the village mayor can set the active project.');
      const catalog = catalogById.get(projectId);
      if (!catalog) throw new Error('Unknown project.');
      await publish(
        buildVillageProjectDefinitionDraft({
          projectId: catalog.id,
          title: catalog.title,
          description: catalog.description,
          goals: catalog.goals,
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  const contribute = useMutation({
    mutationFn: async (input: { resource: VillageProjectResource; amount: number }) => {
      if (!args.myPubkey) throw new Error('You must be logged in to contribute.');
      const projectId = progress.definition?.projectId;
      if (!projectId) throw new Error('No active village project.');
      const stock = args.questState.resources?.[input.resource] ?? 0;
      if (stock < input.amount) throw new Error(`Not enough ${input.resource}.`);
      const contributionId = `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await publish(
        buildVillageProjectContributionDraft({
          projectId,
          resource: input.resource,
          amount: input.amount,
          contributorName: displayName,
          contributionId,
        })
      );
      return input;
    },
    onSuccess: (input) => {
      args.setQuestState((prev) => {
        const resources = { ...(prev.resources ?? {}) };
        resources[input.resource] = Math.max(0, (resources[input.resource] ?? 0) - input.amount);
        const next = { ...prev, resources };
        window.queueMicrotask(() => void args.persistQuestCheckpoint(next));
        return next;
      });
      invalidateFeed();
    },
  });

  return {
    feedQuery,
    progress,
    catalog: VILLAGE_PROJECT_CATALOG,
    isMayor,
    mayorPubkey,
    setActiveProject,
    contribute,
    invalidateFeed,
  };
}
