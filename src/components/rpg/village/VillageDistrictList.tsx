import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';

import { GamePanelScroll } from '../GamePanelScroll';
import type { VillageLotOccupancyView } from './villageLotNostr';
import {
  VILLAGE_BUSINESS_TYPES,
  visibleBuildingDistricts,
  visibleLeaveDistrict,
  type VillageBusinessType,
  type VillageDistrictDef,
  type VillageLotDef,
  type VillagePanelId,
} from './villageCatalog';

type VillageDistrictListProps = {
  questFlags: string[];
  myPubkey: string | undefined;
  occupancyByLotId: Map<string, VillageLotOccupancyView>;
  isClaimPending: boolean;
  isBuildPending: boolean;
  onClaimLot: (input: {
    lotId: string;
    businessName: string;
    businessType: VillageBusinessType;
  }) => Promise<void>;
  onBuildLot: (lotId: string) => Promise<void>;
  onOpenPanel: (panel: VillagePanelId) => void;
  onTravelToLocation: (locationId: string) => void;
};

type ClaimDialogState = { lotId: string; districtTitle: string } | null;
type BuildDialogState = { lotId: string; businessName: string } | null;

const lotButtonClass =
  'block min-w-0 w-full rounded px-0 py-px text-left font-sans text-[13px] leading-snug text-[var(--candle-wax)] transition-colors hover:text-[var(--candle-flame-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--candle-flame-soft)] disabled:cursor-default disabled:opacity-70';

function lotDisplayName(lot: VillageLotDef, occupancy: VillageLotOccupancyView | undefined): string {
  if (occupancy) return occupancy.businessName;
  return lot.label;
}

function isLotClickable(
  lot: VillageLotDef,
  occupancy: VillageLotOccupancyView | undefined,
  myPubkey: string | undefined
): boolean {
  if (lot.kind === 'claimable') {
    if (!occupancy) return true;
    if (myPubkey && occupancy.ownerPubkey === myPubkey && occupancy.status === 'claimed') {
      return true;
    }
    return false;
  }
  return lot.kind === 'system' || lot.kind === 'travel' || lot.kind === 'stub';
}

function VillageLotRow({
  lot,
  district,
  occupancy,
  myPubkey,
  isBuildPending,
  onLotClick,
}: {
  lot: VillageLotDef;
  district: VillageDistrictDef;
  occupancy: VillageLotOccupancyView | undefined;
  myPubkey: string | undefined;
  isBuildPending: boolean;
  onLotClick: (
    lot: VillageLotDef,
    district: VillageDistrictDef,
    occupancy: VillageLotOccupancyView | undefined
  ) => void;
}) {
  const displayName = lotDisplayName(lot, occupancy);
  const clickable = isLotClickable(lot, occupancy, myPubkey);
  const isOwnerBuild =
    lot.kind === 'claimable' &&
    Boolean(
      myPubkey && occupancy && occupancy.ownerPubkey === myPubkey && occupancy.status === 'claimed'
    );

  if (clickable) {
    return (
      <button
        type="button"
        className={lotButtonClass}
        disabled={isOwnerBuild && isBuildPending}
        onClick={() => onLotClick(lot, district, occupancy)}
      >
        {displayName}
      </button>
    );
  }

  return (
    <span className="block px-0 py-px font-sans text-[13px] leading-snug text-[var(--candle-ink-soft)]">
      {displayName}
    </span>
  );
}

function VillageDistrictColumn({
  district,
  occupancyByLotId,
  myPubkey,
  isBuildPending,
  onLotClick,
}: {
  district: VillageDistrictDef;
  occupancyByLotId: Map<string, VillageLotOccupancyView>;
  myPubkey: string | undefined;
  isBuildPending: boolean;
  onLotClick: (
    lot: VillageLotDef,
    district: VillageDistrictDef,
    occupancy: VillageLotOccupancyView | undefined
  ) => void;
}) {
  return (
    <section className="min-w-0" aria-labelledby={`district-${district.id}`}>
      <h3
        id={`district-${district.id}`}
        className="mb-0.5 font-cormorant text-sm font-semibold tracking-[0.02em] text-[var(--candle-wax)]"
      >
        {district.title}
      </h3>
      <ul className="m-0 list-none p-0" role="list">
        {district.lots.map((lot) => (
          <li key={lot.id}>
            <VillageLotRow
              lot={lot}
              district={district}
              occupancy={occupancyByLotId.get(lot.id)}
              myPubkey={myPubkey}
              isBuildPending={isBuildPending}
              onLotClick={onLotClick}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VillageDistrictList({
  questFlags,
  myPubkey,
  occupancyByLotId,
  isClaimPending,
  isBuildPending,
  onClaimLot,
  onBuildLot,
  onOpenPanel,
  onTravelToLocation,
}: VillageDistrictListProps) {
  const { toast } = useToast();
  const buildingDistricts = useMemo(
    () => visibleBuildingDistricts(questFlags),
    [questFlags]
  );
  const leaveDistrict = useMemo(() => visibleLeaveDistrict(questFlags), [questFlags]);

  const [claimDialog, setClaimDialog] = useState<ClaimDialogState>(null);
  const [buildDialog, setBuildDialog] = useState<BuildDialogState>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<VillageBusinessType>('shop');

  const onStubVisit = useCallback(
    (label: string) => {
      toast({ title: label, description: 'Visiting this building is not implemented yet.' });
    },
    [toast]
  );

  const handleLotClick = useCallback(
    (
      lot: VillageLotDef,
      district: VillageDistrictDef,
      occupancy: VillageLotOccupancyView | undefined
    ) => {
      if (lot.kind === 'claimable') {
        if (!occupancy) {
          if (!myPubkey) {
            toast({ title: 'Log in required', description: 'Sign in to claim a village lot.' });
            return;
          }
          setBusinessName('');
          setBusinessType('shop');
          setClaimDialog({ lotId: lot.id, districtTitle: district.title });
          return;
        }
        if (myPubkey && occupancy.ownerPubkey === myPubkey && occupancy.status === 'claimed') {
          setBuildDialog({
            lotId: lot.id,
            businessName: occupancy.businessName,
          });
        }
        return;
      }
      if (!lot.action) return;
      if (lot.action.type === 'panel') onOpenPanel(lot.action.panel);
      else if (lot.action.type === 'travel') onTravelToLocation(lot.action.locationId);
      else onStubVisit(lot.label);
    },
    [myPubkey, onOpenPanel, onStubVisit, onTravelToLocation, toast]
  );

  const submitClaim = async () => {
    if (!claimDialog) return;
    try {
      await onClaimLot({
        lotId: claimDialog.lotId,
        businessName,
        businessType,
      });
      setClaimDialog(null);
      toast({ title: 'Lot claimed', description: 'Your claim is on the village ledger.' });
    } catch (error) {
      toast({
        title: 'Claim failed',
        description: error instanceof Error ? error.message : 'Could not claim lot.',
        variant: 'destructive',
      });
    }
  };

  const submitBuild = async () => {
    if (!buildDialog) return;
    try {
      await onBuildLot(buildDialog.lotId);
      setBuildDialog(null);
      toast({ title: 'Building complete', description: `${buildDialog.businessName} is open for business.` });
    } catch (error) {
      toast({
        title: 'Build failed',
        description: error instanceof Error ? error.message : 'Could not finish building.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <GamePanelScroll className="facsimile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 pr-0">
        <div className="grid grid-cols-2 items-start gap-x-3 gap-y-3">
          {buildingDistricts.map((district) => (
            <VillageDistrictColumn
              key={district.id}
              district={district}
              occupancyByLotId={occupancyByLotId}
              myPubkey={myPubkey}
              isBuildPending={isBuildPending}
              onLotClick={handleLotClick}
            />
          ))}
        </div>

        {leaveDistrict ? (
          <section
            className="mt-2 border-t border-[var(--candle-rule)]/40 pt-2"
            aria-labelledby={`district-${leaveDistrict.id}`}
          >
            <h3
              id={`district-${leaveDistrict.id}`}
              className="mb-0.5 font-cormorant text-sm font-semibold tracking-[0.02em] text-[var(--candle-wax)]"
            >
              {leaveDistrict.title}
            </h3>
            <ul className="m-0 list-none p-0" role="list">
              {leaveDistrict.lots.map((lot) => (
                <li key={lot.id}>
                  <VillageLotRow
                    lot={lot}
                    district={leaveDistrict}
                    occupancy={occupancyByLotId.get(lot.id)}
                    myPubkey={myPubkey}
                    isBuildPending={isBuildPending}
                    onLotClick={handleLotClick}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </GamePanelScroll>

      <Dialog
        open={claimDialog !== null}
        onOpenChange={(open) => {
          if (!open) setClaimDialog(null);
        }}
        modal={false}
      >
        <DialogContent
          className="z-[70] border border-[var(--candle-rule)] bg-[var(--candle-hearth)] text-[var(--candle-ink)] sm:max-w-sm"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-cormorant text-lg text-[var(--candle-wax)]">
              Claim lot
            </DialogTitle>
          </DialogHeader>
          {claimDialog ? (
            <p className="font-sans text-xs text-[var(--candle-ink-soft)]">
              {claimDialog.districtTitle} — stake your claim on the village ledger.
            </p>
          ) : null}
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="business-name" className="font-sans text-xs text-[var(--candle-ink-soft)]">
                Business name
              </Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="border-[var(--candle-rule)] bg-black/30 font-sans text-[var(--candle-ink)]"
                placeholder="The Rusty Nail"
                maxLength={48}
                disabled={isClaimPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="business-type" className="font-sans text-xs text-[var(--candle-ink-soft)]">
                Business type
              </Label>
              <select
                id="business-type"
                className="w-full rounded border border-[var(--candle-rule)] bg-black/30 px-2 py-1.5 font-sans text-sm text-[var(--candle-ink)]"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as VillageBusinessType)}
                disabled={isClaimPending}
              >
                {VILLAGE_BUSINESS_TYPES.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="font-sans"
              onClick={() => setClaimDialog(null)}
              disabled={isClaimPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="font-sans"
              disabled={isClaimPending || businessName.trim().length === 0}
              onClick={() => void submitClaim()}
            >
              {isClaimPending ? 'Claiming…' : 'Claim lot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={buildDialog !== null}
        onOpenChange={(open) => {
          if (!open) setBuildDialog(null);
        }}
        modal={false}
      >
        <DialogContent
          className="z-[70] border border-[var(--candle-rule)] bg-[var(--candle-hearth)] text-[var(--candle-ink)] sm:max-w-sm"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-cormorant text-lg text-[var(--candle-wax)]">
              Finish building
            </DialogTitle>
          </DialogHeader>
          {buildDialog ? (
            <p className="font-sans text-xs text-[var(--candle-ink-soft)]">
              Open <span className="text-[var(--candle-wax)]">{buildDialog.businessName}</span> for
              business? (No resource cost in this version.)
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="font-sans"
              onClick={() => setBuildDialog(null)}
              disabled={isBuildPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="font-sans"
              disabled={isBuildPending}
              onClick={() => void submitBuild()}
            >
              {isBuildPending ? 'Building…' : 'Open for business'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
