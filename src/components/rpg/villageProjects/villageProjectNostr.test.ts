import { describe, expect, it } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';

import {
  NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND,
  VILLAGE_PROJECT_COMMUNITY_TAG,
  VILLAGE_PROJECT_CONTRIBUTION_TAG,
} from './constants';
import {
  buildVillageProjectContributionDraft,
  buildVillageProjectDefinitionDraft,
  applyVillageProjectContributionEventToProgress,
  mergeVillageProjectProgress,
  parseVillageProjectContribution,
  parseVillageProjectDefinition,
  type VillageProjectProgress,
} from './villageProjectNostr';

function mockEvent(
  draft: Omit<NostrEvent, 'id' | 'sig' | 'pubkey' | 'created_at'>
): NostrEvent {
  return {
    ...draft,
    id: 'mock-event-id',
    sig: 'mock-sig',
    pubkey: 'mock-pubkey',
    created_at: 1_700_000_000,
  };
}

describe('villageProjectNostr logs schema', () => {
  it('round-trips goal-logs on project definition', () => {
    const draft = buildVillageProjectDefinitionDraft({
      projectId: 'lithic-workshop',
      title: 'Lithic Workshop',
      description: 'Timber for the yard.',
      goals: { logs: 500 },
    });
    expect(draft.tags).toContainEqual(['goal-logs', '500']);

    const parsed = parseVillageProjectDefinition(mockEvent(draft));
    expect(parsed).not.toBeNull();
    expect(parsed?.goals.logs).toBe(500);
  });

  it('parses logs contributions', () => {
    const draft = buildVillageProjectContributionDraft({
      projectId: 'lithic-workshop',
      resource: 'logs',
      amount: 3,
      contributorName: 'Ada',
      contributionId: 'contrib-test-1',
    });
    expect(draft.kind).toBe(NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND);

    const parsed = parseVillageProjectContribution(mockEvent(draft));
    expect(parsed).toEqual({
      contributorPubkey: 'mock-pubkey',
      contributorName: 'Ada',
      projectId: 'lithic-workshop',
      resource: 'logs',
      amount: 3,
      eventId: 'mock-event-id',
      atMs: 1_700_000_000_000,
    });
  });

  it('still parses stone and iron goals', () => {
    const draft = buildVillageProjectDefinitionDraft({
      projectId: 'smelter-and-forge',
      title: 'Smelter and Forge',
      description: 'Frames and masonry.',
      goals: { logs: 1000, stone: 1000 },
    });
    const parsed = parseVillageProjectDefinition(mockEvent(draft));
    expect(parsed?.goals).toEqual({ logs: 1000, stone: 1000 });
  });

  it('rejects unknown contribution resources', () => {
    const parsed = parseVillageProjectContribution(
      mockEvent({
        kind: NSG_VILLAGE_PROJECT_CONTRIBUTION_KIND,
        content: '',
        tags: [
          ['d', 'contrib-bad'],
          ['t', VILLAGE_PROJECT_COMMUNITY_TAG],
          ['t', VILLAGE_PROJECT_CONTRIBUTION_TAG],
          ['p', 'lithic-workshop'],
          ['resource', 'copperOre'],
          ['amount', '1'],
          ['contributor-name', 'Ada'],
          ['alt', 'Village project resource contribution for No Stranger Game'],
        ],
      })
    );
    expect(parsed).toBeNull();
  });

  it('merges local optimistic logs with stale relay totals', () => {
    const localEvent = mockEvent(
      buildVillageProjectContributionDraft({
        projectId: 'lithic-workshop',
        resource: 'logs',
        amount: 1,
        contributorName: 'Ada',
        contributionId: 'contrib-local',
      })
    );
    localEvent.id = 'local-event-id';

    const local: VillageProjectProgress = applyVillageProjectContributionEventToProgress(
      {
        definition: {
          projectId: 'lithic-workshop',
          title: 'Lithic Workshop',
          description: 'Timber for the yard.',
          goals: { logs: 500 },
          mayorPubkey: 'mayor-pk',
          eventId: 'def-id',
          updatedAt: 1,
        },
        totals: { logs: 1 },
        contributions: [],
      },
      localEvent
    );

    const remote: VillageProjectProgress = {
      definition: local.definition,
      totals: { logs: 0 },
      contributions: [],
    };

    const merged = mergeVillageProjectProgress(local, remote);
    expect(merged.totals.logs).toBe(1);
    expect(merged.contributions).toHaveLength(1);
  });
});
