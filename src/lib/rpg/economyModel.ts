export interface LocationEconomy {
  id: string;
  label: string;
  baseCostOfLiving: number;
  workTable: Array<{
    role: string;
    minIncome: number;
    maxIncome: number;
    revealTrait?: string;
  }>;
}

export const LOCATION_ECONOMIES: Record<string, LocationEconomy> = {
  dawnharbor: {
    id: 'dawnharbor',
    label: 'Dawnharbor',
    baseCostOfLiving: 6,
    workTable: [
      { role: 'Roadside Forager', minIncome: 3, maxIncome: 8, revealTrait: 'Patient' },
      { role: 'Dock Runner', minIncome: 4, maxIncome: 10, revealTrait: 'Steady Hands' },
      { role: 'Night Scavenger', minIncome: 2, maxIncome: 12, revealTrait: 'Night Owl' },
    ],
  },
  market_square: {
    id: 'market_square',
    label: 'Market Square',
    baseCostOfLiving: 7,
    workTable: [
      { role: 'Courier', minIncome: 4, maxIncome: 10, revealTrait: 'Fleet Footed' },
      { role: 'Street Vendor', minIncome: 3, maxIncome: 9, revealTrait: 'Silver Tongue' },
      { role: 'Pickpocket Attempt', minIncome: -2, maxIncome: 14, revealTrait: 'Risk-Taker' },
    ],
  },
  forest_edge: {
    id: 'forest_edge',
    label: 'Forest Edge',
    baseCostOfLiving: 5,
    workTable: [
      { role: 'Berry Forager', minIncome: 2, maxIncome: 8, revealTrait: 'Forager' },
      { role: 'Wood Hauler', minIncome: 4, maxIncome: 9, revealTrait: 'Strong Back' },
      { role: 'Mushroom Gatherer', minIncome: 3, maxIncome: 11, revealTrait: 'Myco-Curious' },
    ],
  },
};

export const resolveEconomy = (locationId: string): LocationEconomy =>
  LOCATION_ECONOMIES[locationId] ?? LOCATION_ECONOMIES.dawnharbor;
