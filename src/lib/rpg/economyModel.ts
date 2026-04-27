export interface LocationEconomy {
  id: string;
  label: string;
  baseCostOfLiving: number;
  workTable: Array<{
    role: string;
    minIncome: number;
    maxIncome: number;
    revealTrait?: string;
    requiresTrait?: string;
  }>;
}

export const LOCATION_ECONOMIES: Record<string, LocationEconomy> = {
  dawnharbor: {
    id: 'dawnharbor',
    label: 'Dawnharbor',
    baseCostOfLiving: 6,
    workTable: [
      { role: 'Roadside Forager', minIncome: 3, maxIncome: 8, revealTrait: 'Patient' },
      { role: 'Dock Runner', minIncome: 4, maxIncome: 10, revealTrait: 'Steady Hands', requiresTrait: 'Fleet Footed' },
      { role: 'Night Scavenger', minIncome: 2, maxIncome: 12, revealTrait: 'Night Owl' },
      { role: 'Harbor Porter', minIncome: 5, maxIncome: 11, revealTrait: 'Strong Back' },
      { role: 'Ferry Helper', minIncome: 3, maxIncome: 9, revealTrait: 'Patient' },
    ],
  },
  market_square: {
    id: 'market_square',
    label: 'Market Square',
    baseCostOfLiving: 7,
    workTable: [
      { role: 'Courier', minIncome: 4, maxIncome: 10, revealTrait: 'Fleet Footed' },
      { role: 'Street Vendor', minIncome: 3, maxIncome: 9, revealTrait: 'Silver Tongue', requiresTrait: 'Charming' },
      { role: 'Pickpocket Attempt', minIncome: -2, maxIncome: 14, revealTrait: 'Risk-Taker', requiresTrait: 'Cunning' },
      { role: 'Errand Runner', minIncome: 3, maxIncome: 8, revealTrait: 'Steady Hands' },
      { role: 'Guard Scribe', minIncome: 4, maxIncome: 12, revealTrait: 'Disciplined' },
    ],
  },
  forest_edge: {
    id: 'forest_edge',
    label: 'Forest Edge',
    baseCostOfLiving: 5,
    workTable: [
      { role: 'Berry Forager', minIncome: 2, maxIncome: 8, revealTrait: 'Forager' },
      { role: 'Wood Hauler', minIncome: 4, maxIncome: 9, revealTrait: 'Strong Back' },
      { role: 'Mushroom Gatherer', minIncome: 3, maxIncome: 11, revealTrait: 'Myco-Curious', requiresTrait: 'Patient' },
      { role: 'Trapper', minIncome: 2, maxIncome: 12, revealTrait: 'Hunter' },
      { role: 'Herbal Gatherer', minIncome: 3, maxIncome: 10, revealTrait: 'Gentle' },
    ],
  },
  fungal_woods: {
    id: 'fungal_woods',
    label: 'Fungal Woods',
    baseCostOfLiving: 4,
    workTable: [
      { role: 'Spore Harvester', minIncome: 3, maxIncome: 12, revealTrait: 'Myco-Curious' },
      { role: 'Bog Herbalist', minIncome: 4, maxIncome: 11, revealTrait: 'Patient', requiresTrait: 'Gentle' },
      { role: 'Root Knife Forager', minIncome: 2, maxIncome: 10, revealTrait: 'Survivor' },
      { role: 'Glowcap Trader', minIncome: 5, maxIncome: 13, revealTrait: 'Silver Tongue', requiresTrait: 'Charming' },
      { role: 'Mire Scout', minIncome: 1, maxIncome: 9, revealTrait: 'Fleet Footed' },
    ],
  },
  mining_depths: {
    id: 'mining_depths',
    label: 'Mining Depths',
    baseCostOfLiving: 7,
    workTable: [
      { role: 'Ore Breaker', minIncome: 5, maxIncome: 12, revealTrait: 'Strong Back' },
      { role: 'Tunnel Rigger', minIncome: 4, maxIncome: 11, revealTrait: 'Disciplined' },
      { role: 'Lantern Carrier', minIncome: 3, maxIncome: 8, revealTrait: 'Night Owl' },
      { role: 'Gem Sorter', minIncome: 4, maxIncome: 14, revealTrait: 'Patient' },
      { role: 'Collapsed Shaft Salvager', minIncome: -1, maxIncome: 13, revealTrait: 'Risk-Taker' },
    ],
  },
  coastal_port: {
    id: 'coastal_port',
    label: 'Coastal Port',
    baseCostOfLiving: 8,
    workTable: [
      { role: 'Net Mender', minIncome: 3, maxIncome: 9, revealTrait: 'Patient' },
      { role: 'Deckhand', minIncome: 5, maxIncome: 13, revealTrait: 'Steady Hands' },
      { role: 'Dock Broker', minIncome: 4, maxIncome: 12, revealTrait: 'Silver Tongue', requiresTrait: 'Charming' },
      { role: 'Smuggler Runner', minIncome: 1, maxIncome: 16, revealTrait: 'Cunning' },
      { role: 'Harbor Watch', minIncome: 4, maxIncome: 10, revealTrait: 'Disciplined' },
    ],
  },
  royal_district: {
    id: 'royal_district',
    label: 'Royal District',
    baseCostOfLiving: 10,
    workTable: [
      { role: 'Chamber Clerk', minIncome: 6, maxIncome: 13, revealTrait: 'Disciplined' },
      { role: 'Courier of Seals', minIncome: 5, maxIncome: 12, revealTrait: 'Fleet Footed' },
      { role: 'Tutor Scribe', minIncome: 6, maxIncome: 14, revealTrait: 'Patient' },
      { role: 'Kitchen Steward', minIncome: 4, maxIncome: 10, revealTrait: 'Gentle' },
      { role: 'Back Alley Informant', minIncome: 0, maxIncome: 15, revealTrait: 'Cunning' },
    ],
  },
  temple_ruins: {
    id: 'temple_ruins',
    label: 'Temple Ruins',
    baseCostOfLiving: 5,
    workTable: [
      { role: 'Relic Sweeper', minIncome: 2, maxIncome: 9, revealTrait: 'Patient' },
      { role: 'Stone Reader', minIncome: 4, maxIncome: 12, revealTrait: 'Faithful' },
      { role: 'Pilgrim Guide', minIncome: 3, maxIncome: 10, revealTrait: 'Charming' },
      { role: 'Crypt Watcher', minIncome: 2, maxIncome: 11, revealTrait: 'Night Owl' },
      { role: 'Quiet Mendicant', minIncome: 1, maxIncome: 7, revealTrait: 'Humble' },
    ],
  },
  marsh_camp: {
    id: 'marsh_camp',
    label: 'Marsh Camp',
    baseCostOfLiving: 4,
    workTable: [
      { role: 'Reed Cutter', minIncome: 2, maxIncome: 9, revealTrait: 'Strong Back' },
      { role: 'Eel Trapper', minIncome: 3, maxIncome: 12, revealTrait: 'Hunter' },
      { role: 'Bog Courier', minIncome: 2, maxIncome: 10, revealTrait: 'Fleet Footed' },
      { role: 'Mire Scavenger', minIncome: 0, maxIncome: 11, revealTrait: 'Survivor' },
      { role: 'Swamp Charm Seller', minIncome: 3, maxIncome: 9, revealTrait: 'Silver Tongue' },
    ],
  },
  sewers: {
    id: 'sewers',
    label: 'Sewer Warrens',
    baseCostOfLiving: 3,
    workTable: [
      { role: 'Rat Catcher', minIncome: 2, maxIncome: 8, revealTrait: 'Survivor' },
      { role: 'Drain Runner', minIncome: 1, maxIncome: 12, revealTrait: 'Fleet Footed' },
      { role: 'Scrap Picker', minIncome: 2, maxIncome: 9, revealTrait: 'Cunning' },
      { role: 'Black Market Errand', minIncome: -1, maxIncome: 15, revealTrait: 'Risk-Taker' },
      { role: 'Torch Keeper', minIncome: 2, maxIncome: 7, revealTrait: 'Night Owl' },
    ],
  },
};

export const resolveEconomy = (locationId: string): LocationEconomy =>
  LOCATION_ECONOMIES[locationId] ?? LOCATION_ECONOMIES.dawnharbor;

const LOCATION_GRAPH: Record<string, string[]> = {
  dawnharbor: ['market_square', 'coastal_port'],
  market_square: ['dawnharbor', 'forest_edge', 'royal_district', 'sewers'],
  forest_edge: ['market_square', 'fungal_woods', 'marsh_camp', 'temple_ruins'],
  fungal_woods: ['forest_edge', 'marsh_camp', 'temple_ruins'],
  mining_depths: ['royal_district', 'forest_edge'],
  coastal_port: ['dawnharbor', 'royal_district'],
  royal_district: ['market_square', 'coastal_port', 'mining_depths', 'temple_ruins'],
  temple_ruins: ['forest_edge', 'royal_district', 'fungal_woods'],
  marsh_camp: ['forest_edge', 'fungal_woods', 'sewers'],
  sewers: ['market_square', 'marsh_camp'],
};

export const getAdjacentLocations = (locationId: string): string[] =>
  LOCATION_GRAPH[locationId] ?? ['market_square'];
