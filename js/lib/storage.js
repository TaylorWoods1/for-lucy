import { CONFIG } from '../config.js';

const DEFAULT_DATA = {
  cycles: [],
  settings: {
    partnerName: '',
    defaultCycleLength: CONFIG.defaults.cycleLength,
    defaultPeriodLength: CONFIG.defaults.periodLength,
  },
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isIsoDate(value) {
  return typeof value === 'string' && CONFIG.validation.datePattern.test(value);
}

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

  /**
   * Remove a logged cycle by its start date.
   * @param {string} startDate
   * @returns {boolean} true when an entry was removed
   */
  deleteCycle(startDate) {
    const data = this._load();
    const next = data.cycles.filter((c) => c.startDate !== startDate);
    if (next.length === data.cycles.length) return false;
    data.cycles = next;
    this._save(data);
    return true;
  },

  /**
   * Record the end date for a logged cycle (unlocks learned period length).
   * @param {string} startDate
   * @param {string} endDate
   * @returns {boolean} true when the entry was updated
   */
  setPeriodEnd(startDate, endDate) {
    if (!isIsoDate(endDate) || endDate < startDate) return false;
    const data = this._load();
    const cycle = data.cycles.find((c) => c.startDate === startDate);
    if (!cycle) return false;
    cycle.endDate = endDate;
    this._save(data);
    return true;
  },

  /** @returns {{ partnerName: string, defaultCycleLength: number, defaultPeriodLength: number }} */
  getSettings() {
    return this._load().settings;
  },

  /** @param {Partial<{ partnerName: string, defaultCycleLength: number, defaultPeriodLength: number }>} settings */
  saveSettings(settings) {
    const data = this._load();
    data.settings = { ...data.settings, ...settings };
    this._save(data);
  },

  /** @returns {typeof DEFAULT_DATA} */
  getAll() {
    return this._load();
  },

  /**
   * Serialize all data for backup download.
   * @returns {string}
   */
  exportData() {
    return JSON.stringify(this._load(), null, 2);
  },

  /**
   * Validate and restore data from a backup, replacing current data.
   * Unknown fields are dropped; invalid backups leave storage untouched.
   * @param {string} raw
   * @returns {boolean} true when the import succeeded
   */
  importData(raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.cycles)) return false;

    const cycles = [];
    for (const entry of parsed.cycles) {
      if (!entry || !isIsoDate(entry.startDate)) return false;
      const cycle = { startDate: entry.startDate };
      if (entry.endDate !== undefined) {
        if (!isIsoDate(entry.endDate) || entry.endDate < entry.startDate) return false;
        cycle.endDate = entry.endDate;
      }
      if (cycles.some((c) => c.startDate === cycle.startDate)) continue;
      cycles.push(cycle);
    }
    cycles.sort((a, b) => a.startDate.localeCompare(b.startDate));

    const settings = { ...DEFAULT_DATA.settings };
    if (parsed.settings && typeof parsed.settings === 'object') {
      if (typeof parsed.settings.partnerName === 'string') {
        settings.partnerName = parsed.settings.partnerName.trim().slice(0, 40);
      }
      for (const key of ['defaultCycleLength', 'defaultPeriodLength']) {
        const value = parsed.settings[key];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
          settings[key] = Math.round(value);
        }
      }
    }

    this._save({ cycles, settings });
    return true;
  },

  /** Clear all stored data (for settings/export flows). */
  clearAll() {
    localStorage.removeItem(CONFIG.storage.key);
  },
};

export default Storage;
