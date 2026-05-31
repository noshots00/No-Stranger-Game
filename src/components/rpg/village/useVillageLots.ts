import { useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { VILLAGE_LOT_FEED_STALE_MS } from './constants';
import type { VillageBusinessType } from './villageCatalog';
import { findVillageLotById } from './villageCatalog';
import {
  buildVillageLotBuildDraft,
  buildVillageLotClaimDraft,
  mergeVillageLotState,
  villageLotFilter,
  type VillageLotOccupancyView,
} from './villageLotNostr';

const VILLAGE_LOTS_FEED_KEY = ['village-lots'] as const;

export function useVillageLots(args: {
  enabled: boolean;
  ownerName: string;
  myPubkey: string | undefined;
}) {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: VILLAGE_LOTS_FEED_KEY,
    queryFn: async () => {
      const events = (await nostr.query([villageLotFilter()])) as NostrEvent[];
      return mergeVillageLotState(events);
    },
    enabled: args.enabled,
    staleTime: VILLAGE_LOT_FEED_STALE_MS,
    refetchInterval: args.enabled ? VILLAGE_LOT_FEED_STALE_MS : false,
  });

  const occupancyByLotId: Map<string, VillageLotOccupancyView> =
    feedQuery.data ?? new Map<string, VillageLotOccupancyView>();

  const invalidateFeed = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: VILLAGE_LOTS_FEED_KEY });
  }, [queryClient]);

  const claimLot = useMutation({
    mutationFn: async (input: {
      lotId: string;
      businessName: string;
      businessType: VillageBusinessType;
    }) => {
      if (!args.myPubkey) throw new Error('You must be logged in to claim a lot.');
      const found = findVillageLotById(input.lotId);
      if (!found || found.lot.kind !== 'claimable') {
        throw new Error('This lot cannot be claimed.');
      }
      const events = (await nostr.query([villageLotFilter()])) as NostrEvent[];
      const liveOccupancy = mergeVillageLotState(events);
      if (liveOccupancy.has(input.lotId)) {
        throw new Error('This lot is already claimed.');
      }
      const name = input.businessName.trim();
      if (!name) throw new Error('Enter a business name.');
      await publish(
        buildVillageLotClaimDraft({
          lotId: input.lotId,
          districtId: found.district.id,
          businessName: name,
          businessType: input.businessType,
          ownerName: args.ownerName,
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  const buildLot = useMutation({
    mutationFn: async (input: { lotId: string }) => {
      if (!args.myPubkey) throw new Error('You must be logged in to build.');
      const events = (await nostr.query([villageLotFilter()])) as NostrEvent[];
      const liveOccupancy = mergeVillageLotState(events);
      const occupancy = liveOccupancy.get(input.lotId);
      if (!occupancy) throw new Error('Lot is not claimed.');
      if (occupancy.ownerPubkey !== args.myPubkey) {
        throw new Error('Only the lot owner can build here.');
      }
      if (occupancy.status === 'built') throw new Error('This building is already built.');
      await publish(
        buildVillageLotBuildDraft({
          lotId: occupancy.lotId,
          districtId: occupancy.districtId,
          businessName: occupancy.businessName,
          businessType: occupancy.businessType,
          ownerName: occupancy.ownerName,
        })
      );
    },
    onSuccess: () => invalidateFeed(),
  });

  return {
    feedQuery,
    occupancyByLotId,
    claimLot,
    buildLot,
    invalidateFeed,
  };
}
