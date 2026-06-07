import { describe, expect, it } from 'vitest';
import {
  buildJobEarningLines,
  computeDailyYieldRange,
  formatJobResourceEarningLine,
  formatNextDayCountdownLine,
  formatNextDayCountdownCorner,
} from './earningDisplay';
import { JOB_SLUG_STONECUTTER } from '../constants';

describe('computeDailyYieldRange', () => {
  it('maps base 10 stone to 7-12', () => {
    expect(computeDailyYieldRange(10)).toEqual({ min: 7, max: 12 });
  });
});

describe('formatJobResourceEarningLine', () => {
  it('formats compact stone/day copy', () => {
    expect(
      formatJobResourceEarningLine({
        baseAmount: 10,
        resourceKey: 'stone',
      })
    ).toBe('7-12 stone/day');
  });
});

describe('buildJobEarningLines', () => {
  it('builds lines for stonecutter from registry', () => {
    const lines = buildJobEarningLines(JOB_SLUG_STONECUTTER, {
      explorationXp: 0,
      foragingXp: 0,
      meleeAttackXp: 0,
    });
    expect(lines).toEqual(['7-12 stone/day']);
  });
});

describe('formatNextDayCountdownLine', () => {
  it('formats hours and minutes', () => {
    expect(formatNextDayCountdownLine(3, 2 * 60 * 60 * 1000 + 5 * 60 * 1000)).toBe(
      'Day 4 starts in 02:05'
    );
  });
});

describe('formatNextDayCountdownCorner', () => {
  it('formats hours, minutes, and seconds for the banner corner', () => {
    expect(formatNextDayCountdownCorner(9, 2 * 60 * 60 * 1000 + 5 * 60 * 1000 + 43 * 1000)).toBe(
      'Day 10 in 2 hours and 05:43'
    );
    expect(formatNextDayCountdownCorner(0, 45 * 1000)).toBe('Day 1 in 0 hours and 00:45');
    expect(formatNextDayCountdownCorner(2, 3_600_000)).toBe('Day 3 in 1 hour and 00:00');
  });
});
