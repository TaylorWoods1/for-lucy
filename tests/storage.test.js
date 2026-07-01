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
      defaultCycleLength: 28,
      defaultPeriodLength: 5,
    });
  });

  it('merges setting updates', () => {
    Storage.saveSettings({ defaultCycleLength: 30 });
    expect(Storage.getSettings().defaultCycleLength).toBe(30);
    expect(Storage.getSettings().defaultPeriodLength).toBe(5);
  });

  it('clears all data', () => {
    Storage.saveCycle({ startDate: '2026-06-01' });
    Storage.clearAll();
    expect(Storage.getCycles()).toEqual([]);
  });
});
