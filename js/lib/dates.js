import { CONFIG } from '../config.js';

const MS_PER_DAY = 86_400_000;

/**
 * Parse an ISO date string (YYYY-MM-DD) as a local calendar date.
 * @param {string} iso
 * @returns {Date}
 */
export function parseDateISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a Date as YYYY-MM-DD in the configured timezone.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function formatDateISO(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CONFIG.timezone,
  }).format(date);
}

/**
 * Today's date as YYYY-MM-DD in the configured timezone.
 * @returns {string}
 */
export function todayISO() {
  return formatDateISO(new Date());
}

/**
 * Inclusive calendar-day difference between two dates or ISO strings.
 * @param {string | Date} start
 * @param {string | Date} end
 * @returns {number}
 */
export function daysBetween(start, end) {
  const startDate =
    typeof start === 'string' ? parseDateISO(start) : parseDateISO(formatDateISO(start));
  const endDate = typeof end === 'string' ? parseDateISO(end) : parseDateISO(formatDateISO(end));
  return Math.round((endDate - startDate) / MS_PER_DAY);
}

/**
 * Add calendar days to an ISO date string without timezone drift.
 * @param {string} iso
 * @param {number} days
 * @returns {string}
 */
export function addDaysISO(iso, days) {
  const date = parseDateISO(iso);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Human-readable date for UI, e.g. "Thu, 2 July".
 * @param {string} iso
 * @returns {string}
 */
export function formatDisplayDate(iso) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: CONFIG.timezone,
  }).format(parseDateISO(iso));
}

/**
 * Short weekday label for UI, e.g. "Thu".
 * @param {string} iso
 * @returns {string}
 */
export function formatWeekday(iso) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    timeZone: CONFIG.timezone,
  }).format(parseDateISO(iso));
}

/**
 * Validate a YYYY-MM-DD string.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidDateISO(value) {
  return CONFIG.validation.datePattern.test(value);
}
