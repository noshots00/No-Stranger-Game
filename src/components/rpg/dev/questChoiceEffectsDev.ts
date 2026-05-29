import type { ChoiceEffect, ModifierMap, QuestChoice } from '../quests/types';

function formatModifierMap(map: ModifierMap | undefined): string | null {
  if (!map) return null;
  const entries = Object.entries(map).filter(([, v]) => typeof v === 'number' && Number.isFinite(v));
  if (entries.length === 0) return null;
  entries.sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`).join(', ');
}

function pushIf(lines: string[], label: string, value: string | null | undefined): void {
  if (value === null || value === undefined || value.length === 0) return;
  lines.push(`${label}: ${value}`);
}

/** Dev-only lines describing one quest choice's flags, modifiers, and routing. */
export function formatQuestChoiceDevLines(choice: QuestChoice): string[] {
  const lines: string[] = [];
  const fx: ChoiceEffect | undefined = choice.effects;

  pushIf(lines, 'nextStepId', choice.nextStepId);
  if (choice.completeQuest) lines.push('completeQuest');
  if (choice.randomBranch) {
    const p = choice.randomBranch.probability ?? 0.5;
    lines.push(
      `randomBranch: ${(p * 100).toFixed(0)}% → ${choice.randomBranch.successStepId} | else ${choice.randomBranch.failStepId}`
    );
  }

  if (fx?.modifiersDelta) pushIf(lines, 'modifiersDelta', formatModifierMap(fx.modifiersDelta));
  if (fx?.flagsSet?.length) pushIf(lines, 'flagsSet', fx.flagsSet.join(', '));
  if (fx?.questItemsAdd?.length) pushIf(lines, 'questItemsAdd', fx.questItemsAdd.join(', '));
  if (fx?.assignRaceFromRaceModifiers) lines.push('assignRaceFromRaceModifiers');
  if (fx?.clearActiveQuest) lines.push('clearActiveQuest');
  if (fx?.setCurrentLocation) pushIf(lines, 'setCurrentLocation', fx.setCurrentLocation);
  if (fx?.unlockJobSlugs?.length) pushIf(lines, 'unlockJobSlugs', fx.unlockJobSlugs.join(', '));
  if (typeof fx?.healthLossFraction === 'number') {
    pushIf(lines, 'healthLossFraction', `${(fx.healthLossFraction * 100).toFixed(0)}%`);
  }
  if (typeof fx?.healthDelta === 'number') {
    pushIf(lines, 'healthDelta', `${fx.healthDelta >= 0 ? '+' : ''}${fx.healthDelta}`);
  }

  if (choice.disabledIfAnyFlags?.length) {
    pushIf(lines, 'disabledIfAnyFlags', choice.disabledIfAnyFlags.join(', '));
  }
  if (choice.enabledIfAnyFlags?.length) {
    pushIf(lines, 'enabledIfAnyFlags', choice.enabledIfAnyFlags.join(', '));
  }
  if (choice.disabledUnlessModifiersAtLeast) {
    pushIf(lines, 'disabledUnlessModifiersAtLeast', formatModifierMap(choice.disabledUnlessModifiersAtLeast));
  }
  if (choice.disabledLabel !== undefined) {
    pushIf(lines, 'disabledLabel', JSON.stringify(choice.disabledLabel));
  }
  if (choice.worldEventLogAdd?.length) {
    pushIf(lines, 'worldEventLogAdd', choice.worldEventLogAdd.join(' | '));
  }
  if (choice.journalSummaryLineAdd) {
    pushIf(lines, 'journalSummaryLineAdd', choice.journalSummaryLineAdd);
  }

  if (lines.length === 0) lines.push('(no modifiers, flags, or routing)');
  return lines;
}

export function formatChoiceStepDevLines(step: {
  id: string;
  worldEventLogAfterChoice?: string[];
}): string[] {
  if (!step.worldEventLogAfterChoice?.length) return [];
  return [`step ${step.id} worldEventLogAfterChoice: ${step.worldEventLogAfterChoice.join(' | ')}`];
}
