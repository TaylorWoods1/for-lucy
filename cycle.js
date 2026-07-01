import { CONFIG } from './config.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDateISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateISO(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CONFIG.timezone,
  }).format(date);
}

function todayISO() {
  return formatDateISO(new Date());
}

function daysBetween(start, end) {
  const startDate = typeof start === 'string' ? parseDateISO(start) : parseDateISO(formatDateISO(start));
  const endDate = typeof end === 'string' ? parseDateISO(end) : parseDateISO(formatDateISO(end));
  return Math.round((endDate - startDate) / MS_PER_DAY);
}

function averageCycleLength(cycles) {
  if (cycles.length < 2) return null;
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(daysBetween(sorted[i - 1].startDate, sorted[i].startDate));
  }
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
}

function averagePeriodLength(cycles) {
  const withEnd = cycles.filter((c) => c.endDate);
  if (!withEnd.length) return null;
  const lengths = withEnd.map((c) => daysBetween(c.startDate, c.endDate) + 1);
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

function getPhase(cycleDay, cycleLength, periodLength) {
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

const PHASE_LABELS = {
  period: 'Period',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
  pms: 'PMS',
};

function getCycleState(cycles, settings, todayIso = todayISO()) {
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

function formatDisplayDate(iso) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: CONFIG.timezone,
  }).format(parseDateISO(iso));
}

function getUpcomingPeriods(cycles, settings, count = 3, todayIso = todayISO()) {
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

  const first = predictions[0];
  const isOverdue = daysBetween(lastStart, todayIso) + 1 > cycleLength;

  return {
    next: first,
    upcoming: predictions.slice(1),
    cycleLength,
    basisLabel: learnedCycle ? `${learnedCycle}-day average` : '28-day default',
    isOverdue,
  };
}

export {
  getCycleState,
  getUpcomingPeriods,
  getPhase,
  formatDateISO,
  formatDisplayDate,
  todayISO,
  daysBetween,
  averageCycleLength,
  PHASE_LABELS,
};
