import { describe, expect, it } from 'vitest';
import {
  averageCycleLength,
  getCycleState,
  getPhase,
  getUpcomingPeriods,
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
  });
});
