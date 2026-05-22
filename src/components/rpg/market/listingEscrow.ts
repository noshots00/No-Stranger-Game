import { applyDirectModifiersDelta } from '../quests/engine';
import { formatCoinShort, getCopperFromModifiers, splitCopperIntoCoins, toItemLabel } from '../helpers';
import type { QuestState } from '../quests/types';
import type { MarketListingView } from './marketListingNostr';

export type EscrowedGoods =
  | { kind: 'modifierItem'; key: string; quantity: number }
  | { kind: 'questItem'; label: string };

export type InventoryOption =
  | { kind: 'modifierItem'; key: string; label: string; quantity: number }
  | { kind: 'questItem'; label: string };

export type PostListingInput = {
  modifierItemKey?: string;
  modifierItemQty?: number;
  questItemLabel?: string;
};

export function listInventoryOptions(state: QuestState): InventoryOption[] {
  const out: InventoryOption[] = [];
  for (const [key, qty] of Object.entries(state.modifiers)) {
    if (!key.startsWith('item:') || qty <= 0) continue;
    out.push({ kind: 'modifierItem', key, label: toItemLabel(key), quantity: qty });
  }
  for (const label of state.questItems) {
    if (label.trim()) out.push({ kind: 'questItem', label });
  }
  return out;
}

function buildGoodsFromInput(input: PostListingInput): EscrowedGoods | null {
  if (input.modifierItemKey && (input.modifierItemQty ?? 0) > 0) {
    return {
      kind: 'modifierItem',
      key: input.modifierItemKey,
      quantity: Math.floor(input.modifierItemQty!),
    };
  }
  if (input.questItemLabel?.trim()) {
    return { kind: 'questItem', label: input.questItemLabel.trim() };
  }
  return null;
}

function validateCanList(state: QuestState, goods: EscrowedGoods): string | null {
  if (goods.kind === 'modifierItem') {
    const have = state.modifiers[goods.key] ?? 0;
    if (have < goods.quantity) return `Not enough ${toItemLabel(goods.key)}.`;
  }
  if (goods.kind === 'questItem') {
    if (!state.questItems.includes(goods.label)) return `You do not have "${goods.label}".`;
  }
  return null;
}

function deductGoods(state: QuestState, goods: EscrowedGoods): QuestState {
  if (goods.kind === 'modifierItem') {
    return applyDirectModifiersDelta(state, { [goods.key]: -goods.quantity });
  }
  const idx = state.questItems.indexOf(goods.label);
  if (idx < 0) return state;
  return { ...state, questItems: state.questItems.filter((_, i) => i !== idx) };
}

function restoreGoods(state: QuestState, goods: EscrowedGoods): QuestState {
  if (goods.kind === 'modifierItem') {
    return applyDirectModifiersDelta(state, { [goods.key]: goods.quantity });
  }
  if (!state.questItems.includes(goods.label)) {
    return { ...state, questItems: [...state.questItems, goods.label] };
  }
  return state;
}

export function applyListEscrow(
  state: QuestState,
  listingId: string,
  input: PostListingInput,
  priceCopper: number
): { state: QuestState } | { error: string } {
  const goods = buildGoodsFromInput(input);
  if (!goods) return { error: 'Choose an item to sell.' };
  if (priceCopper <= 0) return { error: 'Price must be greater than zero.' };

  const err = validateCanList(state, goods);
  if (err) return { error: err };

  const next = deductGoods(state, goods);
  const escrow = {
    ...(next.marketEscrowByListingId ?? {}),
    [listingId]: { listingId, goods, priceCopper },
  };
  return { state: { ...next, marketEscrowByListingId: escrow } };
}

export function refundListingEscrow(state: QuestState, listingId: string): QuestState {
  const entry = state.marketEscrowByListingId?.[listingId];
  if (!entry) return state;
  const next = restoreGoods(state, entry.goods);
  const escrow = { ...(next.marketEscrowByListingId ?? {}) };
  delete escrow[listingId];
  return { ...next, marketEscrowByListingId: escrow };
}

export function applyPurchase(
  state: QuestState,
  listing: MarketListingView
): { state: QuestState } | { error: string } {
  if (listing.status !== 'open') return { error: 'This listing is no longer available.' };
  const wallet = getCopperFromModifiers(state.modifiers);
  if (wallet < listing.priceCopper) {
    return { error: `Need ${formatCoinShort(splitCopperIntoCoins(listing.priceCopper))}.` };
  }

  let next = applyDirectModifiersDelta(state, { copper: -listing.priceCopper });
  if (listing.itemKey) {
    next = applyDirectModifiersDelta(next, { [listing.itemKey]: listing.itemQty });
  } else if (listing.itemLabel) {
    const label = listing.itemLabel;
    for (let i = 0; i < listing.itemQty; i++) {
      if (!next.questItems.includes(label)) {
        next = { ...next, questItems: [...next.questItems, label] };
      }
    }
  }
  return { state: next };
}

/** Credit seller when their listing shows as sold on the relay. */
export function reconcileSellerPayouts(
  state: QuestState,
  listings: readonly MarketListingView[],
  myPubkey: string | undefined
): QuestState {
  if (!myPubkey) return state;
  let next = state;
  let changed = false;

  for (const listing of listings) {
    if (listing.pubkey !== myPubkey || listing.status !== 'sold') continue;
    const entry = next.marketEscrowByListingId?.[listing.listingId];
    if (!entry) continue;

    next = applyDirectModifiersDelta(next, { copper: entry.priceCopper });
    const escrow = { ...(next.marketEscrowByListingId ?? {}) };
    delete escrow[listing.listingId];
    next = { ...next, marketEscrowByListingId: escrow };
    changed = true;
  }

  return changed ? next : state;
}

export function formatListingItem(listing: MarketListingView): string {
  const qty = listing.itemQty > 1 ? ` ×${listing.itemQty}` : '';
  return `${listing.itemLabel}${qty}`;
}

export function formatListingPrice(listing: MarketListingView): string {
  return formatCoinShort(splitCopperIntoCoins(listing.priceCopper));
}
