import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  formatDateISO,
  formatDisplayDate,
  isValidDateISO,
  parseDateISO,
} from '../js/lib/dates.js';

describe('dates', () => {
  it('formats today in Brisbane timezone', () => {
    const utcLate = new Date('2026-07-01T20:00:00Z');
    expect(formatDateISO(utcLate)).toBe('2026-07-02');
  });

  it('counts inclusive calendar days between ISO strings', () => {
    expect(daysBetween('2026-06-04', '2026-07-02')).toBe(28);
  });

  it('formats display labels', () => {
    expect(formatDisplayDate('2026-07-02')).toMatch(/2 July/);
  });

  it('parses ISO strings as local calendar dates', () => {
    const date = parseDateISO('2026-07-02');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(2);
  });

  it('validates ISO date strings', () => {
    expect(isValidDateISO('2026-07-02')).toBe(true);
    expect(isValidDateISO('2026-7-2')).toBe(false);
    expect(isValidDateISO('not-a-date')).toBe(false);
  });
});
