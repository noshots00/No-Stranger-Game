export interface RaceDefinition {
  name: string;
  description: string;
}

export const RACE_CATALOG: RaceDefinition[] = [
  { name: 'Human', description: 'Common-born, stubborn, adaptable, and difficult to break.' },
  { name: 'Djanu', description: 'Dusk-blooded wanderers said to carry old desert memory in their bones.' },
  { name: 'Void-Touched', description: 'Marked by strange dreams and moments of impossible stillness.' },
  { name: 'Nord', description: 'Cold-country folk with long winters behind their eyes.' },
  { name: 'Wildborne', description: 'Forest-raised and instinct-led, with a quiet kinship to beasts.' },
];
