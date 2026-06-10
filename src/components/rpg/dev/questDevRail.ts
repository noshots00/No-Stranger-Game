import { ORIGIN_QUEST_OPENED_FLAG, QUEST_ORIGIN_ID } from '../constants';
import { resolveQuestEntryStepId } from '../quests/engine';
import type {
  MessageQuestStep,
  QuestChoice,
  QuestDefinition,
  QuestState,
  QuestStep,
} from '../quests/types';
import {
  formatChoiceStepDevLines,
  formatQuestChoiceDevLines,
  formatQuestChoiceModifierDevLines,
} from './questChoiceEffectsDev';

function pushIf(lines: string[], label: string, value: string | null | undefined): void {
  if (value === null || value === undefined || value.length === 0) return;
  lines.push(`${label}: ${value}`);
}

/** Side effects when the player taps a quest card (before step choices). */
export function formatQuestOpenDevLines(questId: string, playerFlags: readonly string[]): string[] {
  const lines: string[] = [];
  if (questId === QUEST_ORIGIN_ID && !playerFlags.includes(ORIGIN_QUEST_OPENED_FLAG)) {
    lines.push(`flagsSet: ${ORIGIN_QUEST_OPENED_FLAG}`);
  }
  if (questId !== QUEST_ORIGIN_ID) {
    lines.push('acknowledged: clears New badge');
  }
  lines.push('activeQuestId → this quest');
  lines.push('opens quest scene overlay');
  return lines;
}

export function formatMessageStepFlagsRoutingDevLines(step: MessageQuestStep): string[] {
  const lines: string[] = [];
  pushIf(lines, 'nextStepId', step.nextStepId);
  if (step.completeQuest) lines.push('completeQuest');
  if (step.effects) {
    const pseudo: QuestChoice = { id: step.id, label: '', effects: step.effects };
    for (const line of formatQuestChoiceDevLines(pseudo)) {
      if (line.startsWith('nextStepId:')) continue;
      lines.push(line);
    }
  }
  if (lines.length === 0) lines.push('(no flags or routing)');
  return lines;
}

export function formatMessageStepModifierDevLines(step: MessageQuestStep): string[] {
  if (!step.effects) return [];
  const pseudo: QuestChoice = { id: step.id, label: '', effects: step.effects };
  return formatQuestChoiceModifierDevLines(pseudo);
}

function formatChoiceStepFlagsSummary(step: Extract<QuestStep, { type: 'choice' }>): string[] {
  const n = step.choices.length;
  const lines: string[] = [
    `type: choice · ${n} option${n === 1 ? '' : 's'}`,
    'per-choice flags/routing → on scene buttons (Flg)',
  ];
  lines.push(...formatChoiceStepDevLines(step));
  return lines;
}

/** Step-level flags/routing for the dev rail — not a full choice dump (see scene hints). */
export function formatQuestStepFlagsRoutingDevLines(_quest: QuestDefinition, step: QuestStep): string[] {
  if (step.type === 'message') {
    return formatMessageStepFlagsRoutingDevLines(step);
  }
  if (step.type === 'choice') {
    return formatChoiceStepFlagsSummary(step);
  }
  if (step.type === 'input') {
    const lines: string[] = [];
    pushIf(lines, 'field', step.field);
    pushIf(lines, 'nextStepId', step.nextStepId);
    return lines.length > 0 ? lines : ['(input step — no routing on card open)'];
  }
  if (step.type === 'inventoryPick') {
    const lines: string[] = [];
    pushIf(lines, 'nextStepId', step.nextStepId);
    if (step.effects) {
      const pseudo: QuestChoice = { id: step.id, label: '', effects: step.effects };
      for (const line of formatQuestChoiceDevLines(pseudo)) {
        if (line.startsWith('nextStepId:')) continue;
        lines.push(line);
      }
    }
    return lines.length > 0 ? lines : ['(inventory pick — choose in scene)'];
  }
  return ['(unknown step type)'];
}

export function formatQuestStepModifierDevLines(quest: QuestDefinition, step: QuestStep): string[] {
  if (step.type === 'message') {
    return formatMessageStepModifierDevLines(step);
  }
  if (step.type === 'choice') {
    const lines: string[] = [];
    for (const choice of step.choices) {
      const choiceLines = formatQuestChoiceModifierDevLines(choice);
      if (choiceLines.length === 0) continue;
      lines.push(`「${choice.label}」 (${choice.id})`);
      for (const cl of choiceLines) {
        lines.push(`  ${cl}`);
      }
    }
    return lines;
  }
  if (step.type === 'inventoryPick' && step.effects) {
    const pseudo: QuestChoice = { id: step.id, label: '', effects: step.effects };
    return formatQuestChoiceModifierDevLines(pseudo);
  }
  return [];
}

export function resolveQuestDevStep(
  quest: QuestDefinition,
  state: QuestState,
  activeQuestId: string | null | undefined,
  activeStep: QuestStep | null | undefined
): { step: QuestStep; stepLabel: string; entryStepId: string } | null {
  const entryStepId = resolveQuestEntryStepId(quest, state);
  if (quest.id === activeQuestId && activeStep) {
    return { step: activeStep, stepLabel: `Now · ${activeStep.id}`, entryStepId };
  }
  const entryStep = quest.steps[entryStepId];
  if (!entryStep) return null;
  return { step: entryStep, stepLabel: `Opens · ${entryStepId}`, entryStepId };
}
