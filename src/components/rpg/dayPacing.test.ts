import { describe, expect, it } from 'vitest';
import { appendDialogue } from './dialogueFormat';
import { buildDayReportDialogueLines } from './helpers';
import {
  applyDailyXpGrants,
  applyInSessionDayAdvanceAfterMainQuest,
  reconcileForestSessionDay,
  reconcilePlayDayRollStaging,
  stageInSessionDayAdvanceAfterMainQuest,
} from './dayPacing';
import {
  JOB_SLUG_ADVENTURER,
  JOB_SLUG_MINER,
  JOB_SLUG_STONECUTTER,
  JOB_SLUG_WOODCUTTER,
  QUEST_FIRST_NIGHT_ID,
  RESOURCE_ADVENTURES,
  RESOURCE_COPPER_ORE,
  RESOURCE_LOGS,
  RESOURCE_STONE,
} from './constants';
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

  it('forest day roll appends report to the feed without Continue staging', () => {
    const prev = createInitialQuestState();
    const rolled = stageInSessionDayAdvanceAfterMainQuest(
      prev,
      { ...prev, flags: ['quest001-complete'] },
      1,
      QUEST_FIRST_NIGHT_ID,
      true
    );
    expect(rolled.playDayRollStaging).toBeUndefined();
    expect(rolled.activeQuestId).toBeNull();
    const body = rolled.dialogueLog
      .filter((line) => line.speaker === 'Day Report')
      .map((line) => line.text)
      .join('\n');
    expect(body).toContain('Day 1 Report');
    expect(body).toContain('Day 2 begins');
  });

  it('reconcilePlayDayRollStaging clears legacy await_continue staging', () => {
    const prev = createInitialQuestState();
    const legacy = {
      ...prev,
      flags: ['quest001-complete'],
      playDayRollStaging: {
        phase: 'await_continue' as const,
        endingDay: 1,
        nextDay: 2,
        calendarDay: 1,
        sessionOnly: true,
        completedQuestId: QUEST_FIRST_NIGHT_ID,
        prevForReport: {
          modifiers: {},
          skills: createInitialSkills(),
          experience: 0,
          flags: [],
          questItems: [],
          dayReportQuestItemsBaseline: [],
        },
      },
    };
    const fixed = reconcilePlayDayRollStaging(legacy);
    expect(fixed.playDayRollStaging).toBeUndefined();
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
    expect(body).toContain("Gained items: It's a tiny buckler.");
    expect(body).toContain('Day 3 begins');
    expect(next.dayReportQuestItemsBaseline).toContain("It's a tiny buckler.");
  });
});

describe('applyDailyXpGrants profession resources', () => {
  it('grants 10 logs per day for woodcutter', () => {
    const state = {
      ...createInitialQuestState(),
      activeJobSlug: JOB_SLUG_WOODCUTTER,
      lastDailyXpDay: 1,
    };
    const next = applyDailyXpGrants(state, 1, 2);
    expect(next.resources?.[RESOURCE_LOGS]).toBe(10);
  });

  it('grants 10 stone per day for stonecutter', () => {
    const state = {
      ...createInitialQuestState(),
      activeJobSlug: JOB_SLUG_STONECUTTER,
      lastDailyXpDay: 1,
    };
    const next = applyDailyXpGrants(state, 1, 2);
    expect(next.resources?.[RESOURCE_STONE]).toBe(10);
  });

  it('grants 10 copper ore per day for miner', () => {
    const state = {
      ...createInitialQuestState(),
      activeJobSlug: JOB_SLUG_MINER,
      lastDailyXpDay: 1,
    };
    const next = applyDailyXpGrants(state, 1, 2);
    expect(next.resources?.[RESOURCE_COPPER_ORE]).toBe(10);
  });

  it('grants 2 adventures per day for adventurer', () => {
    const state = {
      ...createInitialQuestState(),
      activeJobSlug: JOB_SLUG_ADVENTURER,
      lastDailyXpDay: 1,
    };
    const next = applyDailyXpGrants(state, 1, 2);
    expect(next.resources?.[RESOURCE_ADVENTURES]).toBe(2);
  });

  it('scales grants across multi-day catch-up', () => {
    const state = {
      ...createInitialQuestState(),
      activeJobSlug: JOB_SLUG_WOODCUTTER,
      lastDailyXpDay: 1,
    };
    const next = applyDailyXpGrants(state, 3, 4);
    expect(next.resources?.[RESOURCE_LOGS]).toBe(30);
  });
});
