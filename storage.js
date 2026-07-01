const STORAGE_KEY = 'cycle-companion-data';

const DEFAULT_DATA = {
  cycles: [],
  settings: {
    defaultCycleLength: 28,
    defaultPeriodLength: 5,
  },
};

const Storage = {
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_DATA);
      return { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) };
    } catch {
      return structuredClone(DEFAULT_DATA);
    }
  },

  _save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  getCycles() {
    return this._load().cycles;
  },

  saveCycle(cycle) {
    const data = this._load();
    const exists = data.cycles.some((c) => c.startDate === cycle.startDate);
    if (!exists) {
      data.cycles.push(cycle);
      data.cycles.sort((a, b) => a.startDate.localeCompare(b.startDate));
      this._save(data);
    }
  },

  getSettings() {
    return this._load().settings;
  },

  saveSettings(settings) {
    const data = this._load();
    data.settings = { ...data.settings, ...settings };
    this._save(data);
  },

  getAll() {
    return this._load();
  },
};

export default Storage;
