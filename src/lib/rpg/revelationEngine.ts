import type { AutonomousState } from './autonomousSimulation';

export interface RevelationResult {
  visibleTraits: string[];
  hiddenTraits: string[];
  logLines: string[];
}

export const runRevelationPass = (state: AutonomousState): RevelationResult => {
  const visibleTraits = [...state.visibleTraits];
  const hiddenTraits = [...state.hiddenTraits];
  const logLines: string[] = [];

  if (state.health >= 96 && hiddenTraits.includes('Fast Healer') && !visibleTraits.includes('Fast Healer')) {
    visibleTraits.push('Fast Healer');
    const index = hiddenTraits.indexOf('Fast Healer');
    hiddenTraits.splice(index, 1);
    logLines.push('Unlike others, you recover quickly from strain.');
  }

  if (state.locationId.includes('forest') && hiddenTraits.includes('Forager') && !visibleTraits.includes('Forager')) {
    visibleTraits.push('Forager');
    const index = hiddenTraits.indexOf('Forager');
    hiddenTraits.splice(index, 1);
    logLines.push('The forest answers you more easily now.');
  }

  return { visibleTraits, hiddenTraits, logLines };
};
