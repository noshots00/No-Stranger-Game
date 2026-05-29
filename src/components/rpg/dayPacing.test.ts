import { describe, expect, it } from 'vitest';
import { appendDialogue } from './dialogueFormat';
import { buildDayReportDialogueLines } from './helpers';
import {
  advancePlayDayRollPhase,
  applyInSessionDayAdvanceAfterMainQuest,
  reconcileForestSessionDay,
  stageInSessionDayAdvanceAfterMainQuest,
} from './dayPacing';
import { QUEST_FIRST_NIGHT_ID } from './constants';
import { createInitialQuestState, createInitialSkills } from './quests/engine';

describe('Day 1 report after Sunset', () => {
  it('advances day marker without passive skill XP when daily grants are off', () => {
    const prev = createInitialQuestState();
    const next = applyInSessionDayAdvanceAfterMainQuest(prev, prev, 1, true);
    const reportLines = next.dialogueLog.filter((line) => line.speaker === 'Day Report');
    const body = reportLines.map((line) => line.text).join('\n');
    expect(body).toContain('Day 1 Report');
    expect(body).toContain('Day 2 begins');
    expect(body).not.toMatch(/exploration reached level/i);
    expect(body).not.toMatch(/foraging reached level/i);
    expect(next.lastDailyXpDay).toBe(2);
    expect(next.skills.explorationXp).toBe(0);
    expect(next.skills.foragingXp).toBe(0);
  });

  it('repairs title-only Day 1 report when daily grants are off', () => {
    const broken = {
      ...createInitialQuestState(),
      flags: ['quest001-complete'],
      lastDailyXpDay: 2,
      dialogueLog: [appendDialogue('Day Report', 'Day 1 Report')],
    };
    const fixed = reconcileForestSessionDay(broken);
    expect(fixed.lastDailyXpDay).toBeGreaterThanOrEqual(2);
  });

  it('buildDayReportDialogueLines still lists skill gains when XP changes manually', () => {
    const prev = { ...createInitialQuestState(), skills: createInitialSkills() };
    const next = {
      ...prev,
      skills: { ...prev.skills, explorationXp: 100, foragingXp: 100 },
    };
    const lines = buildDayReportDialogueLines(1, prev, next)
      .map((line) => line.text)
      .join(' ');
    expect(lines).toMatch(/exploration reached level/i);
    expect(lines).toMatch(/foraging reached level/i);
  });

  it('Day 1 report includes modifiers gained during the day before quest completion', () => {
    const atDayStart = createInitialQuestState();
    const afterBoarSpell = {
      ...atDayStart,
      modifiers: { 'stat:intelligence': 1, 'class:mage': 1 },
      dayReportModifierBaseline: atDayStart.dayReportModifierBaseline,
    };
    const next = applyInSessionDayAdvanceAfterMainQuest(afterBoarSpell, afterBoarSpell, 1, true);
    const body = next.dialogueLog
      .filter((line) => line.speaker === 'Day Report')
      .map((line) => line.text)
      .join('\n');
    expect(body).toMatch(/intelligence/i);
    expect(body).toContain('Day 2 begins');
  });

  it('staged forest day roll shows report only after first Continue', () => {
    const prev = createInitialQuestState();
    const staged = stageInSessionDayAdvanceAfterMainQuest(
      prev,
      { ...prev, flags: ['quest001-complete'] },
      1,
      QUEST_FIRST_NIGHT_ID,
      true
    );
    expect(staged.playDayRollStaging?.phase).toBe('before_report');
    expect(staged.dialogueLog.some((line) => line.text.includes('Day 1 Report'))).toBe(false);

    const afterReport = advancePlayDayRollPhase(staged);
    expect(afterReport.playDayRollStaging?.phase).toBe('after_report');
    const body = afterReport.dialogueLog
      .filter((line) => line.speaker === 'Day Report')
      .map((line) => line.text)
      .join('\n');
    expect(body).toContain('Day 1 Report');
    expect(body).toContain('Day 2 begins');

    const done = advancePlayDayRollPhase(afterReport);
    expect(done.playDayRollStaging).toBeUndefined();
  });

  it('Day 2 report lists quest items gained during that day', () => {
    const beforeDay2Report = {
      ...createInitialQuestState(),
      lastDailyXpDay: 2,
      dayReportModifierBaseline: {},
      dayReportQuestItemsBaseline: [],
      questItems: ["It's a tiny buckler."],
      flags: ['quest001-complete', 'abandoned-shelter-complete'],
    };
    const next = applyInSessionDayAdvanceAfterMainQuest(beforeDay2Report, beforeDay2Report, 2, true);
    const body = next.dialogueLog
      .filter((line) => line.speaker === 'Day Report')
      .map((line) => line.text)
      .join('\n');
    expect(body).toContain('Day 2 Report');
    expect(body).toContain("It's a tiny buckler.");
    expect(body).toContain('Day 3 begins');
    expect(next.dayReportQuestItemsBaseline).toContain("It's a tiny buckler.");
  });
});
