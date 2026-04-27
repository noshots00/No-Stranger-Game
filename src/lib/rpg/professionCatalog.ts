export interface ProfessionDefinition {
  name: string;
  description: string;
  minDailyWage: number;
  maxDailyWage: number;
}

export const PROFESSION_CATALOG: ProfessionDefinition[] = [
  { name: 'Woodcutter', description: 'Cut timber at village edge and haul it back at dusk.', minDailyWage: 4, maxDailyWage: 4 },
  { name: 'Miner', description: 'Work shallow shafts, sell ore by the sack.', minDailyWage: 7, maxDailyWage: 7 },
  { name: 'Blacksmith', description: 'Repair tools and shoe horses at the village forge.', minDailyWage: 21, maxDailyWage: 21 },
  { name: 'Tanner', description: 'Clean, cure, and stretch hides into usable leather.', minDailyWage: 16, maxDailyWage: 16 },
  { name: 'Fisher', description: 'Cast lines at dawn and trade fresh catch before noon.', minDailyWage: 5, maxDailyWage: 9 },
  { name: 'Hunter', description: 'Track game and sell meat, bone, and pelt.', minDailyWage: 3, maxDailyWage: 18 },
  { name: 'Clothes Maker', description: 'Patch and stitch simple village garments.', minDailyWage: 6, maxDailyWage: 10 },
  { name: 'Beggar', description: 'Live from kindness, rumors, and weathered patience.', minDailyWage: 1, maxDailyWage: 4 },
];
