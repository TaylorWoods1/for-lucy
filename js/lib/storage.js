import { CONFIG } from '../config.js';

const DEFAULT_DATA = {
  cycles: [],
  settings: {
    defaultCycleLength: CONFIG.defaults.cycleLength,
    defaultPeriodLength: CONFIG.defaults.periodLength,
  },
};

/**
 * Local-only persistence via localStorage.
 * Designed so a future sync layer can wrap these methods without UI changes.
 */
const Storage = {
  /**
   * @returns {typeof DEFAULT_DATA}
   */
  _load() {
    try {
      const raw = localStorage.getItem(CONFIG.storage.key);
      if (!raw) return structuredClone(DEFAULT_DATA);
      return { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) };
    } catch {
      return structuredClone(DEFAULT_DATA);
    }
  },

  /** @param {typeof DEFAULT_DATA} data */
  _save(data) {
    localStorage.setItem(CONFIG.storage.key, JSON.stringify(data));
  },

  /** @returns {Array<{ startDate: string, endDate?: string }>} */
  getCycles() {
    return this._load().cycles;
  },

  /** @param {{ startDate: string, endDate?: string }} cycle */
  saveCycle(cycle) {
    const data = this._load();
    const exists = data.cycles.some((c) => c.startDate === cycle.startDate);
    if (!exists) {
      data.cycles.push(cycle);
      data.cycles.sort((a, b) => a.startDate.localeCompare(b.startDate));
      this._save(data);
    }
  },

  /** @returns {{ defaultCycleLength: number, defaultPeriodLength: number }} */
  getSettings() {
    return this._load().settings;
  },

  /** @param {Partial<{ defaultCycleLength: number, defaultPeriodLength: number }>} settings */
  saveSettings(settings) {
    const data = this._load();
    data.settings = { ...data.settings, ...settings };
    this._save(data);
  },

  /** @returns {typeof DEFAULT_DATA} */
  getAll() {
    return this._load();
  },

  /** Clear all stored data (for settings/export flows). */
  clearAll() {
    localStorage.removeItem(CONFIG.storage.key);
  },
};

export default Storage;
