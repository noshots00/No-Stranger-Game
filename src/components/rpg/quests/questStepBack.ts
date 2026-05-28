import {
  PLAYER_ACTION_SPEAKER,
  QUEST_DIVIDER_SPEAKER,
  QUEST_IMAGE_SPEAKER,
  QUEST_VISUAL_SPEAKER,
} from '@/components/rpg/dialogueFormat';
import type { DialogueLogEntry, QuestDefinition, QuestProgress, QuestState } from './types';

export function pushDevStepHistory(progress: QuestProgress, fromStepId: string): QuestProgress {
  const hist = progress.devStepHistory ?? [];
  if (hist.length > 0 && hist[hist.length - 1] === fromStepId) {
    return progress;
  }
  return { ...progress, devStepHistory: [...hist, fromStepId] };
}

export function canQuestStepBack(state: QuestState, questId: string): boolean {
  const progress = state.progressByQuestId[questId];
  if (!progress || progress.isCompleted) return false;
  return (progress.devStepHistory?.length ?? 0) > 0;
}

function trimQuestDialogueOnBack(dialogueLog: DialogueLogEntry[], questId: string): DialogueLogEntry[] {
  const next = [...dialogueLog];
  let removedPlayerLine = false;

  while (next.length > 0) {
    const last = next[next.length - 1];
    if (last.sourceQuestId !== questId) break;

    const isSkippableVisual =
      last.speaker === QUEST_VISUAL_SPEAKER ||
      last.speaker === QUEST_IMAGE_SPEAKER ||
      last.speaker === QUEST_DIVIDER_SPEAKER;

    if (isSkippableVisual) {
      next.pop();
      continue;
    }

    if ((last.speaker === PLAYER_ACTION_SPEAKER || last.speaker === 'You') && !removedPlayerLine) {
      next.pop();
      removedPlayerLine = true;
      continue;
    }

    next.pop();
    if (removedPlayerLine) break;
  }

  return next;
}

/** Dev/testing: rewind one quest step (does not revert modifiers or flags). */
export function questStepBack(state: QuestState, quest: QuestDefinition): QuestState | null {
  const progress = state.progressByQuestId[quest.id];
  if (!progress || progress.isCompleted) return null;

  const hist = progress.devStepHistory ?? [];
  if (hist.length === 0) return null;

  const prevStepId = hist[hist.length - 1]!;
  if (!quest.steps[prevStepId]) return null;

  const currentStep = quest.steps[progress.currentStepId];
  let choiceHistory = [...progress.choiceHistory];
  if (currentStep?.type === 'choice' && choiceHistory.length > 0) {
    choiceHistory = choiceHistory.slice(0, -1);
  }

  return {
    ...state,
    activeQuestId: quest.id,
    dialogueLog: trimQuestDialogueOnBack(state.dialogueLog, quest.id),
    progressByQuestId: {
      ...state.progressByQuestId,
      [quest.id]: {
        ...progress,
        currentStepId: prevStepId,
        isCompleted: false,
        choiceHistory,
        devStepHistory: hist.slice(0, -1),
      },
    },
  };
}
