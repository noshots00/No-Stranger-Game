import { QUEST_MAYOR_ID, QUEST_PICK_A_JOB_ID } from '../constants';
import type { QuestState } from '../quests/types';

export const PICK_A_JOB_AWAIT_STEP = 'await-profession';
export const MAYOR_AWAIT_STEP = 'await-vote';
export const PICK_A_JOB_CONTINUE_CHOICE = 'go-jobs-hall';
export const MAYOR_CONTINUE_CHOICE = 'go-town-hall';

export function isTownHallTutorialAwaitStep(questId: string, stepId: string): boolean {
  return (
    (questId === QUEST_PICK_A_JOB_ID && stepId === PICK_A_JOB_AWAIT_STEP) ||
    (questId === QUEST_MAYOR_ID && stepId === MAYOR_AWAIT_STEP)
  );
}

export function isTownHallTutorialContinueChoice(questId: string, choiceId: string): boolean {
  return (
    (questId === QUEST_PICK_A_JOB_ID && choiceId === PICK_A_JOB_CONTINUE_CHOICE) ||
    (questId === QUEST_MAYOR_ID && choiceId === MAYOR_CONTINUE_CHOICE)
  );
}

export function townHallTutorialPingPending(questState: QuestState): boolean {
  const pickJob = questState.progressByQuestId[QUEST_PICK_A_JOB_ID];
  if (pickJob && !pickJob.isCompleted && pickJob.currentStepId === PICK_A_JOB_AWAIT_STEP) {
    return true;
  }
  const mayor = questState.progressByQuestId[QUEST_MAYOR_ID];
  if (mayor && !mayor.isCompleted && mayor.currentStepId === MAYOR_AWAIT_STEP) {
    return true;
  }
  return false;
}
