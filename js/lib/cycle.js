import { CONFIG } from '../config.js';
import { addDaysISO, daysBetween, formatDisplayDate, formatWeekday, todayISO } from './dates.js';

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
 * Days between consecutive logged period starts, oldest first.
 * @param {Array<{ startDate: string }>} cycles
 * @returns {number[]}
 */
export function getIntervals(cycles) {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const intervals = [];
  for (let i = 1; i < sorted.length; i += 1) {
    intervals.push(daysBetween(sorted[i - 1].startDate, sorted[i].startDate));
  }
  return intervals;
}

/**
 * Recency-weighted mean — recent values count more than old ones.
 * @param {number[]} values oldest first
 * @param {number} [factor] weight multiplier per step back in time
 * @returns {number | null} unrounded weighted mean
 */
export function weightedMean(values, factor = CONFIG.prediction.recencyFactor) {
  if (!values.length) return null;
  let weightSum = 0;
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    const weight = factor ** (values.length - 1 - i);
    weightSum += weight;
    total += values[i] * weight;
  }
  return total / weightSum;
}

/**
 * Learned statistics about the logged cycle history.
 * @param {Array<{ startDate: string }>} cycles
 * @returns {{ count: number, mean: number, weighted: number, stdDev: number } | null}
 */
export function getCycleStats(cycles) {
  const intervals = getIntervals(cycles);
  if (!intervals.length) return null;
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, x) => sum + (x - mean) ** 2, 0) / intervals.length;
  return {
    count: intervals.length,
    mean: Math.round(mean),
    weighted: Math.round(weightedMean(intervals)),
    stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
  };
}

/**
 * Compute average days between logged period starts.
 * @param {Array<{ startDate: string }>} cycles
 * @returns {number | null}
 */
export function averageCycleLength(cycles) {
  const stats = getCycleStats(cycles);
  return stats ? stats.mean : null;
}

/** @typedef {'learning' | 'regular' | 'variable'} ConfidenceLevel */

/**
 * How confident predictions are, expressed as a ± day window.
 * @param {ReturnType<typeof getCycleStats>} stats
 * @returns {{ level: ConfidenceLevel, windowDays: number }}
 */
export function getConfidence(stats) {
  const p = CONFIG.prediction;
  if (!stats) {
    return { level: 'learning', windowDays: p.learningWindowDays };
  }
  const spread = Math.round(stats.stdDev);
  if (stats.count < p.minIntervalsForConfidence) {
    return { level: 'learning', windowDays: Math.max(2, spread) };
  }
  if (stats.stdDev <= p.regularStdDevDays) {
    return { level: 'regular', windowDays: Math.max(p.minWindowDays, spread) };
  }
  return { level: 'variable', windowDays: Math.min(p.maxWindowDays, Math.max(2, spread)) };
}

/**
 * How accurate recent predictions would have been, computed retroactively:
 * each logged interval is compared against the weighted average of the
 * intervals that came before it.
 * @param {Array<{ startDate: string }>} cycles
 * @param {number} [recent=3] number of most recent comparisons to report
 * @returns {{ count: number, withinDays: number } | null}
 */
export function getPredictionAccuracy(cycles, recent = 3) {
  const intervals = getIntervals(cycles);
  const errors = [];
  for (let i = 1; i < intervals.length; i += 1) {
    const predicted = Math.round(weightedMean(intervals.slice(0, i)));
    errors.push(Math.abs(intervals[i] - predicted));
  }
  if (errors.length < 2) return null;
  const recentErrors = errors.slice(-recent);
  return { count: recentErrors.length, withinDays: Math.max(...recentErrors) };
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
  const latest = sorted[0];
  const lastStart = latest.startDate;
  const cycleDay = daysBetween(lastStart, todayIso) + 1;

  const stats = getCycleStats(cycles);
  const learnedCycle = stats ? stats.weighted : null;
  const cycleLength = learnedCycle || settings.defaultCycleLength;

  const learnedPeriod = averagePeriodLength(cycles);
  const periodLength = learnedPeriod || settings.defaultPeriodLength;

  const daysUntil = cycleLength - cycleDay;
  const phase = getPhase(Math.min(cycleDay, cycleLength), cycleLength, periodLength);
  const progress = Math.min(100, Math.max(0, (cycleDay / cycleLength) * 100));

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
    latestHasEnd: Boolean(latest.endDate),
    nextPeriodDate: addDaysISO(lastStart, cycleLength),
    learnedCycle,
    learnedPeriod,
    stats,
    confidence: getConfidence(stats),
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
  const stats = getCycleStats(cycles);
  const learnedCycle = stats ? stats.weighted : null;
  const cycleLength = learnedCycle || settings.defaultCycleLength;
  const confidence = getConfidence(stats);

  let cursor = addDaysISO(lastStart, cycleLength);
  let guard = 0;
  while (cursor < todayIso && guard < 24) {
    cursor = addDaysISO(cursor, cycleLength);
    guard += 1;
  }

  const predictions = [];
  for (let i = 0; i < count; i += 1) {
    predictions.push({
      date: cursor,
      label: formatDisplayDate(cursor),
      daysUntil: daysBetween(todayIso, cursor),
    });
    cursor = addDaysISO(cursor, cycleLength);
  }

  return {
    next: predictions[0],
    upcoming: predictions.slice(1),
    cycleLength,
    basisLabel: learnedCycle
      ? `${learnedCycle}-day recent average`
      : `${CONFIG.defaults.cycleLength}-day default`,
    isOverdue: daysBetween(lastStart, todayIso) + 1 > cycleLength,
    confidence,
    accuracy: getPredictionAccuracy(cycles),
  };
}

/**
 * Seven-day phase outlook with the first upcoming phase transition.
 * @param {Array<{ startDate: string, endDate?: string }>} cycles
 * @param {{ defaultCycleLength: number, defaultPeriodLength: number }} settings
 * @param {string} [todayIso]
 * @returns {{ days: Array<object>, transition: object | null } | null}
 */
export function getWeekAhead(cycles, settings, todayIso = todayISO()) {
  if (!cycles.length) return null;

  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastStart = sorted[0].startDate;
  const stats = getCycleStats(cycles);
  const cycleLength = (stats ? stats.weighted : null) || settings.defaultCycleLength;
  const periodLength = averagePeriodLength(cycles) || settings.defaultPeriodLength;

  const days = [];
  for (let i = 0; i < CONFIG.ui.weekAheadDays; i += 1) {
    const iso = addDaysISO(todayIso, i);
    const cycleDay = daysBetween(lastStart, iso) + 1;
    // Project future days past the expected start onto the next cycle.
    const effectiveDay = ((cycleDay - 1) % cycleLength) + 1;
    const phase = getPhase(effectiveDay, cycleLength, periodLength);
    days.push({
      date: iso,
      weekday: formatWeekday(iso),
      phase,
      phaseLabel: PHASE_LABELS[phase],
      isToday: i === 0,
    });
  }

  let transition = null;
  for (let i = 1; i < days.length; i += 1) {
    if (days[i].phase !== days[0].phase) {
      transition = {
        phase: days[i].phase,
        phaseLabel: days[i].phaseLabel,
        date: days[i].date,
        weekday: days[i].weekday,
        inDays: i,
      };
      break;
    }
  }

  return { days, transition };
}
