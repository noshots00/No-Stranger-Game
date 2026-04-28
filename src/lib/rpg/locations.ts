export const LOCATION_ID_ALIASES: Record<string, string> = {
  'market-square': 'market_square',
  'forest-edge': 'forest_edge',
  'blackfoot-woods': 'forest_edge',
  'coin-vault': 'royal_district',
  'silent-alley': 'sewers',
};

export const normalizeLocationId = (locationId: string): string => {
  if (!locationId) return 'market_square';
  return LOCATION_ID_ALIASES[locationId] ?? locationId.replaceAll('-', '_');
};
