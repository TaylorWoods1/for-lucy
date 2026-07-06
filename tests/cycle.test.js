import { describe, expect, it } from 'vitest';
import {
  averageCycleLength,
  averagePeriodLength,
  getConfidence,
  getCycleState,
  getCycleStats,
  getPhase,
  getPredictionAccuracy,
  getUpcomingPeriods,
  getWeekAhead,
  PHASE_LABELS,
} from '../js/lib/cycle.js';

const settings = { defaultCycleLength: 28, defaultPeriodLength: 5 };

describe('cycle', () => {
  it('identifies period phase on early cycle days', () => {
    expect(getPhase(3, 28, 5)).toBe('period');
  });

  it('identifies PMS near cycle end', () => {
    expect(getPhase(26, 28, 5)).toBe('pms');
  });

  it('learns average cycle length from history', () => {
    const cycles = [
      { startDate: '2026-04-01' },
      { startDate: '2026-04-29' },
      { startDate: '2026-05-30' },
    ];
    expect(averageCycleLength(cycles)).toBe(30);
  });

  it('returns cycle state with countdown', () => {
    const cycles = [{ startDate: '2026-06-04' }];
    const state = getCycleState(cycles, settings, '2026-06-10');
    expect(state.hasData).toBe(true);
    expect(state.cycleDay).toBe(7);
    expect(state.daysUntil).toBe(21);
    expect(state.phaseLabel).toBe(PHASE_LABELS.follicular);
  });

  it('marks overdue cycles', () => {
    const cycles = [{ startDate: '2026-06-04' }];
    const state = getCycleState(cycles, settings, '2026-07-03');
    expect(state.isOverdue).toBe(true);
  });

  it('predicts upcoming period dates', () => {
    const cycles = [{ startDate: '2026-06-04' }];
    const upcoming = getUpcomingPeriods(cycles, settings, 3, '2026-06-18');
    expect(upcoming.next.date).toBe('2026-07-02');
    expect(upcoming.upcoming).toHaveLength(2);
    expect(upcoming.basisLabel).toContain('28-day default');
    expect(upcoming.confidence).toEqual({ level: 'learning', windowDays: 3 });
    expect(upcoming.accuracy).toBeNull();
  });

  it('learns average period length from logged end dates', () => {
    const cycles = [{ startDate: '2026-06-01', endDate: '2026-06-04' }];
    expect(averagePeriodLength(cycles)).toBe(4);
    const state = getCycleState(cycles, settings, '2026-06-02');
    expect(state.periodLength).toBe(4);
    expect(state.learnedPeriod).toBe(4);
    expect(state.latestHasEnd).toBe(true);
  });
});

describe('cycle stats and confidence', () => {
  const regularHistory = [
    { startDate: '2026-01-01' },
    { startDate: '2026-01-29' },
    { startDate: '2026-02-27' },
    { startDate: '2026-03-28' },
  ];

  it('returns null stats without at least two starts', () => {
    expect(getCycleStats([])).toBeNull();
    expect(getCycleStats([{ startDate: '2026-06-01' }])).toBeNull();
  });

  it('computes mean, weighted mean, and spread', () => {
    const stats = getCycleStats(regularHistory);
    expect(stats.count).toBe(3);
    expect(stats.mean).toBe(29);
    expect(stats.weighted).toBe(29);
    expect(stats.stdDev).toBe(0.5);
  });

  it('weights recent cycles more heavily than old ones', () => {
    const cycles = [
      { startDate: '2026-01-01' },
      { startDate: '2026-01-25' },
      { startDate: '2026-03-02' },
    ];
    const stats = getCycleStats(cycles);
    expect(stats.mean).toBe(30);
    expect(stats.weighted).toBe(31);
  });

  it('reports learning confidence with little history', () => {
    expect(getConfidence(null)).toEqual({ level: 'learning', windowDays: 3 });
    const stats = getCycleStats([{ startDate: '2026-01-01' }, { startDate: '2026-01-29' }]);
    expect(getConfidence(stats).level).toBe('learning');
  });

  it('reports a tight window for regular cycles', () => {
    const confidence = getConfidence(getCycleStats(regularHistory));
    expect(confidence).toEqual({ level: 'regular', windowDays: 1 });
  });

  it('reports a wider window for variable cycles', () => {
    const cycles = [
      { startDate: '2026-01-01' },
      { startDate: '2026-01-25' },
      { startDate: '2026-02-27' },
      { startDate: '2026-03-27' },
    ];
    const confidence = getConfidence(getCycleStats(cycles));
    expect(confidence.level).toBe('variable');
    expect(confidence.windowDays).toBe(4);
  });

  it('measures retroactive prediction accuracy', () => {
    expect(
      getPredictionAccuracy([{ startDate: '2026-01-01' }, { startDate: '2026-01-29' }]),
    ).toBeNull();
    const accuracy = getPredictionAccuracy(regularHistory);
    expect(accuracy).toEqual({ count: 2, withinDays: 1 });
  });
});

describe('week ahead', () => {
  it('returns a seven-day phase outlook with the next transition', () => {
    const cycles = [{ startDate: '2026-06-01' }];
    const week = getWeekAhead(cycles, settings, '2026-06-04');
    expect(week.days).toHaveLength(7);
    expect(week.days[0]).toMatchObject({ date: '2026-06-04', phase: 'period', isToday: true });
    expect(week.transition).toMatchObject({
      phase: 'follicular',
      date: '2026-06-06',
      inDays: 2,
    });
  });

  it('projects the next period when the cycle wraps within the week', () => {
    const cycles = [{ startDate: '2026-06-01' }];
    const week = getWeekAhead(cycles, settings, '2026-06-27');
    expect(week.days[0].phase).toBe('pms');
    expect(week.transition).toMatchObject({ phase: 'period', date: '2026-06-29', inDays: 2 });
  });

  it('returns null without data', () => {
    expect(getWeekAhead([], settings, '2026-06-04')).toBeNull();
  });
});
