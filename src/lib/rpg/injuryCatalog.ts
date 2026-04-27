export interface InjuryDefinition {
  id: string;
  label: string;
  incomeModifier: number;
  healChance: number;
  revealLine: string;
}

export const INJURY_CATALOG: InjuryDefinition[] = [
  {
    id: 'old-leg-pain',
    label: 'Old Leg Pain',
    incomeModifier: -1,
    healChance: 0.05,
    revealLine: 'You wake with a deep ache in your leg.',
  },
  {
    id: 'broken-finger',
    label: 'Broken Finger',
    incomeModifier: -2,
    healChance: 0.08,
    revealLine: 'A finger bends the wrong way. You splint it with bark.',
  },
  {
    id: 'lingering-fever',
    label: 'Lingering Fever',
    incomeModifier: -3,
    healChance: 0.15,
    revealLine: 'A fever grips you by nightfall. You shiver through the dawn.',
  },
  {
    id: 'deep-scar',
    label: 'Deep Scar',
    incomeModifier: 0,
    healChance: 0,
    revealLine: 'The scar across your ribs will never fade.',
  },
];

export const resolveInjury = (injuryName: string): InjuryDefinition | undefined =>
  INJURY_CATALOG.find((entry) => entry.label === injuryName || entry.id === injuryName);
