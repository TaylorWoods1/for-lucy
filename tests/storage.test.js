import { beforeEach, describe, expect, it, vi } from 'vitest';

const memoryStore = {};

vi.stubGlobal('localStorage', {
  getItem: (key) => memoryStore[key] ?? null,
  setItem: (key, value) => {
    memoryStore[key] = value;
  },
  removeItem: (key) => {
    delete memoryStore[key];
  },
});

const { default: Storage } = await import('../js/lib/storage.js');

describe('storage', () => {
  beforeEach(() => {
    Object.keys(memoryStore).forEach((key) => delete memoryStore[key]);
  });

  it('starts empty', () => {
    expect(Storage.getCycles()).toEqual([]);
  });

  it('saves unique cycle starts sorted chronologically', () => {
    Storage.saveCycle({ startDate: '2026-06-10' });
    Storage.saveCycle({ startDate: '2026-05-01' });
    Storage.saveCycle({ startDate: '2026-06-10' });
    expect(Storage.getCycles()).toEqual([{ startDate: '2026-05-01' }, { startDate: '2026-06-10' }]);
  });

  it('returns default settings', () => {
    expect(Storage.getSettings()).toEqual({
      partnerName: '',
      defaultCycleLength: 28,
      defaultPeriodLength: 5,
    });
  });

  it('merges setting updates', () => {
    Storage.saveSettings({ partnerName: 'Lucy', defaultCycleLength: 30 });
    expect(Storage.getSettings().partnerName).toBe('Lucy');
    expect(Storage.getSettings().defaultCycleLength).toBe(30);
    expect(Storage.getSettings().defaultPeriodLength).toBe(5);
  });

  it('clears all data', () => {
    Storage.saveCycle({ startDate: '2026-06-01' });
    Storage.clearAll();
    expect(Storage.getCycles()).toEqual([]);
  });

  it('deletes a cycle by start date', () => {
    Storage.saveCycle({ startDate: '2026-06-01' });
    Storage.saveCycle({ startDate: '2026-07-01' });
    expect(Storage.deleteCycle('2026-06-01')).toBe(true);
    expect(Storage.getCycles()).toEqual([{ startDate: '2026-07-01' }]);
    expect(Storage.deleteCycle('2026-06-01')).toBe(false);
  });

  it('records a period end date on an existing cycle', () => {
    Storage.saveCycle({ startDate: '2026-06-01' });
    expect(Storage.setPeriodEnd('2026-06-01', '2026-06-05')).toBe(true);
    expect(Storage.getCycles()).toEqual([{ startDate: '2026-06-01', endDate: '2026-06-05' }]);
  });

  it('rejects invalid period end dates', () => {
    Storage.saveCycle({ startDate: '2026-06-10' });
    expect(Storage.setPeriodEnd('2026-06-10', '2026-06-01')).toBe(false);
    expect(Storage.setPeriodEnd('2026-06-10', 'garbage')).toBe(false);
    expect(Storage.setPeriodEnd('2026-01-01', '2026-01-05')).toBe(false);
    expect(Storage.getCycles()).toEqual([{ startDate: '2026-06-10' }]);
  });

  it('round-trips data through export and import', () => {
    Storage.saveCycle({ startDate: '2026-06-01' });
    Storage.setPeriodEnd('2026-06-01', '2026-06-05');
    Storage.saveSettings({ partnerName: 'Lucy', defaultCycleLength: 30 });
    const backup = Storage.exportData();

    Storage.clearAll();
    expect(Storage.importData(backup)).toBe(true);
    expect(Storage.getCycles()).toEqual([{ startDate: '2026-06-01', endDate: '2026-06-05' }]);
    expect(Storage.getSettings()).toEqual({
      partnerName: 'Lucy',
      defaultCycleLength: 30,
      defaultPeriodLength: 5,
    });
  });

  it('rejects malformed backups without touching stored data', () => {
    Storage.saveCycle({ startDate: '2026-06-01' });
    expect(Storage.importData('not json')).toBe(false);
    expect(Storage.importData('{"cycles":"nope"}')).toBe(false);
    expect(Storage.importData('{"cycles":[{"startDate":"junk"}]}')).toBe(false);
    expect(
      Storage.importData('{"cycles":[{"startDate":"2026-06-10","endDate":"2026-06-01"}]}'),
    ).toBe(false);
    expect(Storage.getCycles()).toEqual([{ startDate: '2026-06-01' }]);
  });

  it('sanitizes unknown fields and bad settings on import', () => {
    const raw = JSON.stringify({
      cycles: [{ startDate: '2026-06-01', evil: '<script>' }],
      settings: { defaultCycleLength: -3, defaultPeriodLength: 6, extra: true },
    });
    expect(Storage.importData(raw)).toBe(true);
    expect(Storage.getCycles()).toEqual([{ startDate: '2026-06-01' }]);
    expect(Storage.getSettings()).toEqual({
      partnerName: '',
      defaultCycleLength: 28,
      defaultPeriodLength: 6,
    });
  });
});
