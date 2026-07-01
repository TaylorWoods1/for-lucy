const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDateOnly(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateISO(date) {
  return toDateOnly(date).toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  return Math.round((toDateOnly(end) - toDateOnly(start)) / MS_PER_DAY);
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

function getCycleState(cycles, settings, today = new Date()) {
  if (!cycles.length) {
    return { hasData: false };
  }

  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastStart = sorted[0].startDate;
  const cycleDay = daysBetween(lastStart, today) + 1;

  const learnedCycle = averageCycleLength(cycles);
  const cycleLength = learnedCycle || settings.defaultCycleLength;

  const learnedPeriod = averagePeriodLength(cycles);
  const periodLength = learnedPeriod || settings.defaultPeriodLength;

  const daysUntil = cycleLength - cycleDay;
  const phase = getPhase(Math.min(cycleDay, cycleLength), cycleLength, periodLength);
  const progress = Math.min(100, Math.max(0, (cycleDay / cycleLength) * 100));

  const nextPeriodDate = new Date(toDateOnly(lastStart));
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

export {
  getCycleState,
  getPhase,
  formatDateISO,
  daysBetween,
  averageCycleLength,
  PHASE_LABELS,
};
