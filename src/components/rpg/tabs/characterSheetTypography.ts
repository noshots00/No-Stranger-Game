/**

 * Character sheet type scale — fixed px sizes (no vw clamps).

 *

 * | Element              | px |

 * |----------------------|-----|

 * | Name                 | 16  |

 * | Level / race / class | 11  |

 * | Profile + traits     | 10  |

 * | Stat values          | 9   |

 * | Stat labels          | 8   |

 */



/** Tier 1: player name */

export const CHAR_NAME =
  'font-cormorant text-[16px] font-semibold leading-tight tracking-[0.03em] text-[var(--candle-ink)]';



/** Tier 3: level · race · class */

export const CHAR_SUBTITLE =
  'font-serif text-[10px] leading-snug text-[var(--candle-ink-soft)]';



/** Tier 4: profile meta + traits/skills body */

export const CHAR_BODY = 'font-serif text-[10px] leading-snug';



export const CHAR_META_LABEL = 'text-[var(--candle-ink-soft)]';

export const CHAR_META_VALUE = 'text-[var(--candle-ink)]';

export const CHAR_META_FAINT = 'text-[var(--candle-ink-faint)]';



/** Primary attribute table (labels/values set their own sizes) */

export const CHAR_STAT_TABLE = 'font-serif leading-tight text-[var(--candle-ink-soft)]';



/** Tier 5: primary attribute captions */

export const CHAR_STAT_LABEL =

  'break-words text-[8px] uppercase tracking-[0.08em] text-[var(--candle-ink-faint)]';



/** Tier 2: primary attribute values */

export const CHAR_STAT_VALUE =

  'mt-0.5 font-mono text-[9px] tabular-nums leading-none text-[var(--candle-ink)]';



/** Ability tile labels */

export const CHAR_TILE_NAME =

  'line-clamp-2 text-[10px] font-medium uppercase leading-none tracking-[0.04em]';

export const CHAR_TILE_LEVEL = 'mt-px font-mono text-[9px] tabular-nums leading-none';



/** Footer / secondary links */

export const CHAR_FOOTER = 'font-serif text-[10px] leading-snug';



export const CHAR_ACTION_LINK =

  'font-serif text-[10px] leading-snug text-[var(--candle-wax)]';


