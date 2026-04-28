export type CompanionId = 'elara' | 'bran' | 'mira' | 'sera';

export interface CompanionDefinition {
  id: CompanionId;
  name: string;
  archetype: string;
  introLine: string;
}

export const COMPANIONS: CompanionDefinition[] = [
  { id: 'elara', name: 'Elara', archetype: 'Scholar', introLine: 'Elara studies every scrap you bring.' },
  { id: 'bran', name: 'Bran', archetype: 'Woodcutter', introLine: 'Bran challenges you to keep up.' },
  { id: 'mira', name: 'Mira', archetype: 'Weaver', introLine: 'Mira watches more than she speaks.' },
  { id: 'sera', name: 'Sera', archetype: 'Farmer', introLine: 'Sera talks loudly to hide a quiet fear.' },
];
