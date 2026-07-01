import { CONFIG } from '../config.js';
import { daysBetween, formatDateISO, formatDisplayDate, parseDateISO, todayISO } from './dates.js';

/** @typedef {'period' | 'follicular' | 'ovulation' | 'luteal' | 'pms'} Phase */

/** @type {Record<Phase, string>} */
export const PHASE_LABELS = {
  period: 'Period',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
  pms: 'PMS',
};

/**
 * Compute average days between logged period starts.
 * @param {Array<{ startDate: string }>} cycles
 * @returns {number | null}
 */
export function averageCycleLength(cycles) {
  if (cycles.length < 2) return null;
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const intervals = [];
  for (let i = 1; i < sorted.length; i += 1) {
    intervals.push(daysBetween(sorted[i - 1].startDate, sorted[i].startDate));
  }
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
}

/**
 * Compute average period length when end dates are logged.
 * @param {Array<{ startDate: string, endDate?: string }>} cycles
 * @returns {number | null}
 */
export function averagePeriodLength(cycles) {
  const withEnd = cycles.filter((c) => c.endDate);
  if (!withEnd.length) return null;
  const lengths = withEnd.map((c) => daysBetween(c.startDate, c.endDate) + 1);
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

/**
 * Determine cycle phase from day number.
 * @param {number} cycleDay
 * @param {number} cycleLength
 * @param {number} periodLength
 * @returns {Phase}
 */
export function getPhase(cycleDay, cycleLength, periodLength) {
  if (cycleDay <= periodLength) return 'period';

  const pmsStart = cycleLength - 4;
  if (cycleDay >= pmsStart) return 'pms';

  const mid = Math.round(cycleLength / 2);
  const ovulationStart = mid - 1;
  const ovulationEnd = mid + 1;

  if (cycleDay >= ovulationStart && cycleDay <= ovulationEnd) return 'ovulation';
  if (cycleDay < ovulationStart) return 'follicular';
  return 'luteal';
}

/**
 * Current cycle snapshot for the dashboard.
 * @param {Array<{ startDate: string, endDate?: string }>} cycles
 * @param {{ defaultCycleLength: number, defaultPeriodLength: number }} settings
 * @param {string} [todayIso]
 * @returns {object}
 */
export function getCycleState(cycles, settings, todayIso = todayISO()) {
  if (!cycles.length) {
    return { hasData: false };
  }

  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastStart = sorted[0].startDate;
  const cycleDay = daysBetween(lastStart, todayIso) + 1;

  const learnedCycle = averageCycleLength(cycles);
  const cycleLength = learnedCycle || settings.defaultCycleLength;

  const learnedPeriod = averagePeriodLength(cycles);
  const periodLength = learnedPeriod || settings.defaultPeriodLength;

  const daysUntil = cycleLength - cycleDay;
  const phase = getPhase(Math.min(cycleDay, cycleLength), cycleLength, periodLength);
  const progress = Math.min(100, Math.max(0, (cycleDay / cycleLength) * 100));

  const nextPeriodDate = parseDateISO(lastStart);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

  return {
    hasData: true,
    cycleDay,
    cycleLength,
    periodLength,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    daysUntil: Math.max(0, daysUntil),
    isOverdue: cycleDay > cycleLength,
    progress,
    lastStart,
    nextPeriodDate: formatDateISO(nextPeriodDate),
    learnedCycle,
    learnedPeriod,
  };
}

/**
 * Predict upcoming period start dates.
 * @param {Array<{ startDate: string }>} cycles
 * @param {{ defaultCycleLength: number }} settings
 * @param {number} [count=3]
 * @param {string} [todayIso]
 * @returns {object}
 */
export function getUpcomingPeriods(
  cycles,
  settings,
  count = CONFIG.ui.upcomingPeriodCount,
  todayIso = todayISO(),
) {
  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastStart = sorted[0].startDate;
  const learnedCycle = averageCycleLength(cycles);
  const cycleLength = learnedCycle || settings.defaultCycleLength;

  let cursor = parseDateISO(lastStart);
  cursor.setDate(cursor.getDate() + cycleLength);

  const today = parseDateISO(todayIso);
  let guard = 0;
  while (cursor < today && guard < 24) {
    cursor.setDate(cursor.getDate() + cycleLength);
    guard += 1;
  }

  const predictions = [];
  for (let i = 0; i < count; i += 1) {
    const iso = formatDateISO(cursor);
    predictions.push({
      date: iso,
      label: formatDisplayDate(iso),
      daysUntil: daysBetween(todayIso, iso),
    });
    cursor.setDate(cursor.getDate() + cycleLength);
  }

  return {
    next: predictions[0],
    upcoming: predictions.slice(1),
    cycleLength,
    basisLabel: learnedCycle
      ? `${learnedCycle}-day average`
      : `${CONFIG.defaults.cycleLength}-day default`,
    isOverdue: daysBetween(lastStart, todayIso) + 1 > cycleLength,
  };
}
