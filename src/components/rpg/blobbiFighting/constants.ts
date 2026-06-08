/** Blobbi NIP-BB current state (addressable, read-only in NSG). */
export const BLOBBI_STATE_KIND = 31124;

/** Blobbi NIP-BB lifecycle biography memory (published after fights). */
export const BLOBBI_LIFECYCLE_KIND = 14921;

/** Addressable replaceable — one open registration per author (`d`: blobbi-fight-open). */
export const NSG_BLOBBI_FIGHT_OPEN_KIND = 30343;
export const BLOBBI_FIGHT_OPEN_D_TAG = 'blobbi-fight-open';

/** Regular immutable — published when a pairing resolves. */
export const NSG_BLOBBI_FIGHT_MATCH_KIND = 10051;

export const BLOBBI_FIGHT_COMMUNITY_TAG = 'no-stranger-game';
export const BLOBBI_FIGHT_OPEN_QUEUE_TAG = 'blobbi-fight-open';
export const BLOBBI_FIGHT_MATCH_TAG = 'blobbi-fight-match';

export const BLOBBI_FIGHT_LOCATION = 'no_stranger_blobbi_fighting';

export const BLOBBI_STATE_QUERY_LIMIT = 50;
export const BLOBBI_FIGHT_QUERY_LIMIT_OPEN = 30;
export const BLOBBI_FIGHT_QUERY_LIMIT_MATCHES = 25;
export const BLOBBI_FIGHT_MEMORY_QUERY_LIMIT = 40;

/** Wait after publish before refetching fight feed so relays can index the event. */
export const BLOBBI_RELAY_SETTLE_MS = 2000;
