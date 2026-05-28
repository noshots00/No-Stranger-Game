import type { QuestContext, QuestDefinition, QuestStep, QuestVisualBeat } from './types';

type AuthoredQuestStep = QuestStep & {
  visuals?: QuestVisualBeat[];
};

type QuestAuthoringOptions = {
  id: string;
  title: string;
  briefing: string;
  createdAt: number;
  startStepId: string;
  steps: AuthoredQuestStep[];
  isAvailable?: (context: QuestContext) => boolean;
  isUnveilEligible?: (context: QuestContext) => boolean;
  /** Marks this quest as the calendar-main arc for daily XP credit when completed. */
  mainDailyQuest?: boolean;
  stepVisuals?: Partial<Record<string, QuestVisualBeat[]>>;
  completionRequiresAllFlags?: string[];
  journalSummariesByChoicePath?: Record<string, string>;
  journalSummaryFallback?: string;
  questCardLayout?: 'default' | 'title-overlay' | 'title-overlay-hero';
  questCardImageSide?: 'left' | 'right';
  toneTag?: 'vision' | 'echo' | 'mundane';
  locationPopup?: boolean;
  locationRepeats?: boolean;
  locationGated?: boolean;
  requiredPlayLocation?: string;
  questCardInteractive?: boolean;
};

/** Small quest-authoring helper: write steps as an ordered array, emit typed quest definition. */
export function createQuestDefinition(options: QuestAuthoringOptions): QuestDefinition {
  const inlineStepVisuals: Partial<Record<string, QuestVisualBeat[]>> = {};
  const steps = options.steps.reduce<Record<string, QuestStep>>((acc, authoredStep) => {
    const { visuals, ...step } = authoredStep;
    acc[step.id] = step;
    if (visuals && visuals.length > 0) {
      inlineStepVisuals[step.id] = visuals;
    }
    return acc;
  }, {});
  const mergedStepVisuals = {
    ...inlineStepVisuals,
    ...(options.stepVisuals ?? {}),
  };
  const hasStepVisuals = Object.keys(mergedStepVisuals).length > 0;

  return {
    id: options.id,
    title: options.title,
    briefing: options.briefing,
    createdAt: options.createdAt,
    startStepId: options.startStepId,
    steps,
    isAvailable: options.isAvailable ?? (() => true),
    ...(options.isUnveilEligible ? { isUnveilEligible: options.isUnveilEligible } : {}),
    ...(options.mainDailyQuest ? { mainDailyQuest: true } : {}),
    ...(hasStepVisuals ? { stepVisuals: mergedStepVisuals } : {}),
    ...(options.completionRequiresAllFlags
      ? { completionRequiresAllFlags: options.completionRequiresAllFlags }
      : {}),
    ...(options.journalSummariesByChoicePath
      ? { journalSummariesByChoicePath: options.journalSummariesByChoicePath }
      : {}),
    ...(options.journalSummaryFallback ? { journalSummaryFallback: options.journalSummaryFallback } : {}),
    ...(options.questCardLayout ? { questCardLayout: options.questCardLayout } : {}),
    ...(options.questCardImageSide ? { questCardImageSide: options.questCardImageSide } : {}),
    ...(options.toneTag ? { toneTag: options.toneTag } : {}),
    ...(options.locationPopup ? { locationPopup: true } : {}),
    ...(options.locationRepeats ? { locationRepeats: true } : {}),
    ...(options.locationGated ? { locationGated: true } : {}),
    ...(options.requiredPlayLocation ? { requiredPlayLocation: options.requiredPlayLocation } : {}),
    ...(options.questCardInteractive === false ? { questCardInteractive: false } : {}),
  };
}
