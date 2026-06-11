import { describe, expect, it } from 'vitest';
import { appendDialogue } from './dialogueFormat';
import { buildDayReportDialogueLines } from './helpers';
import {
  applyDailyXpGrants,
  applyInSessionDayAdvanceAfterMainQuest,
  applyVillageRolloverOnLogin,
  reconcileForestSessionDay,
  reconcilePlayDayRollStaging,
  stageInSessionDayAdvanceAfterMainQuest,
} from './dayPacing';
import {
  DAY_PACING_ACTIVE_FLAG,
  JOB_SLUG_ADVENTURER,
  JOB_SLUG_MINER,
  JOB_SLUG_STONECUTTER,
  JOB_SLUG_WOODCUTTER,
  QUEST_FIRST_NIGHT_ID,
  RESOURCE_ADVENTURES,
  RESOURCE_COPPER_ORE,
  RESOURCE_LOGS,
  RESOURCE_STONE,
  VILLAGE_PHASE_FLAG,
} from './constants';
import { getEasternMidnightUtcFromYmd } from '@/lib/easternGameTime';
import { createInitialQuestState, createInitialSkills } from './quests/engine';

describe('Day 1 pacing after Sunset', () => {
  it('advances day marker without passive skill XP or Day Report in forest', () => {
    const prev = createInitialQuestState();
    const next = applyInSessionDayAdvanceAfterMainQuest(prev, prev, 1, true);
    expect(next.dialogueLog.filter((line) => line.speaker === 'Day Report')).toHaveLength(0);
    expect(next.lastDailyXpDay).toBe(2);
    expect(next.skills.explorationXp).toBe(0);
    expect(next.skills.foragingXp).toBe(0);
  });

  it('strips legacy Day 1 report lines from forest saves', () => {
    const broken = {
      ...createInitialQuestState(),
      flags: ['quest001-complete'],
      lastDailyXpDay: 2,
      dialogueLog: [appendDialogue('Day Report', 'Day 1 Report')],
    };
    const fixed = reconcileForestSessionDay(broken);
    expect(fixed.lastDailyXpDay).toBeGreaterThanOrEqual(2);
    expect(fixed.dialogueLog.filter((line) => line.speaker === 'Day Report')).toHaveLength(0);
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

  it('forest day advance does not append Day Report to dialogueLog', () => {
    const atDayStart = createInitialQuestState();
    const afterBoarSpell = {
      ...atDayStart,
      modifiers: { 'stat:intelligence': 1, 'class:mage': 1 },
      dayReportModifierBaseline: atDayStart.dayReportModifierBaseline,
    };
    const next = applyInSessionDayAdvanceAfterMainQuest(afterBoarSpell, afterBoarSpell, 1, true);
    expect(next.dialogueLog.filter((line) => line.speaker === 'Day Report')).toHaveLength(0);
    expect(next.lastDailyXpDay).toBe(2);
  });

  it('forest day roll advances pacing without Continue staging or Day Report', () => {
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
    expect(rolled.dialogueLog.filter((line) => line.speaker === 'Day Report')).toHaveLength(0);
    expect(rolled.lastDailyXpDay).toBe(2);
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

  it('forest day advance updates quest-item baseline without Day Report', () => {
    const beforeDay2Report = {
      ...createInitialQuestState(),
      lastDailyXpDay: 2,
      dayReportModifierBaseline: {},
      dayReportQuestItemsBaseline: [],
      questItems: ["It's a tiny buckler."],
      flags: ['quest001-complete', 'abandoned-shelter-complete'],
    };
    const next = applyInSessionDayAdvanceAfterMainQuest(beforeDay2Report, beforeDay2Report, 2, true);
    expect(next.dialogueLog.filter((line) => line.speaker === 'Day Report')).toHaveLength(0);
    expect(next.dayReportQuestItemsBaseline).toContain("It's a tiny buckler.");
    expect(next.lastDailyXpDay).toBe(3);
  });
});

describe('applyVillageRolloverOnLogin', () => {
  it('rolls one narrative day after an Eastern midnight since the last grant', () => {
    const state = {
      ...createInitialQuestState(),
      flags: [VILLAGE_PHASE_FLAG, DAY_PACING_ACTIVE_FLAG],
      lastDailyXpDay: 4,
      lastDailyXpGrantEasternYmd: '2026-06-09',
    };
    const nowUtcMs = getEasternMidnightUtcFromYmd('2026-06-10') + 60_000;
    const next = applyVillageRolloverOnLogin(state, nowUtcMs);
    expect(next.lastDailyXpDay).toBe(5);
    expect(next.lastDailyXpGrantEasternYmd).toBe('2026-06-10');
    expect(
      next.dialogueLog.some((line) => line.speaker === 'Day Report' && line.text === 'Day 4 Report')
    ).toBe(true);
    expect(
      next.dialogueLog.some((line) => line.speaker === 'Day Report' && line.text === 'Day 5 begins')
    ).toBe(true);
  });

  it('anchors grant date on first village day without rolling', () => {
    const state = {
      ...createInitialQuestState(),
      flags: [VILLAGE_PHASE_FLAG, DAY_PACING_ACTIVE_FLAG],
      lastDailyXpDay: 4,
      lastDailyXpGrantEasternYmd: null,
    };
    const nowUtcMs = getEasternMidnightUtcFromYmd('2026-06-10') + 60_000;
    const next = applyVillageRolloverOnLogin(
      { ...state, lastDailyXpGrantEasternYmd: '2026-06-10' },
      nowUtcMs
    );
    expect(next.lastDailyXpDay).toBe(4);
    expect(next.dialogueLog.filter((line) => line.speaker === 'Day Report')).toHaveLength(0);
  });

  it('legacy saves without grant ymd roll once on login after Eastern midnight', () => {
    const state = {
      ...createInitialQuestState(),
      flags: [VILLAGE_PHASE_FLAG, DAY_PACING_ACTIVE_FLAG],
      lastDailyXpDay: 4,
      lastDailyXpGrantEasternYmd: null,
    };
    const nowUtcMs = getEasternMidnightUtcFromYmd('2026-06-10') + 60_000;
    const next = applyVillageRolloverOnLogin(state, nowUtcMs);
    expect(next.lastDailyXpDay).toBe(5);
    expect(next.lastDailyXpGrantEasternYmd).toBe('2026-06-10');
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
