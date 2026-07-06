/**
 * Central application configuration.
 * Single source of truth for personalization, defaults, and runtime constants.
 */
export const CONFIG = {
  app: {
    title: 'Cycle Companion',
    tagline: 'Show up when it matters most',
    description: 'Track cycle phases and get supportive partner tips.',
    /** Fallback copy before a partner name is saved in settings. */
    defaultName: 'her',
    themeColor: '#c4777b',
  },
  /** Device and install requirements — both must pass for the app to run. */
  platform: {
    requireMobile: true,
  },
  pwa: {
    requireInstall: true,
  },
  /** IANA timezone for all calendar dates (GMT+10, no daylight saving). */
  timezone: 'Australia/Brisbane',
  defaults: {
    cycleLength: 28,
    periodLength: 5,
  },
  /** Self-learning prediction parameters. */
  prediction: {
    /** Weight multiplier per step back in time — recent cycles matter more. */
    recencyFactor: 0.8,
    /** Std deviation (days) at or below which cycles count as regular. */
    regularStdDevDays: 1.5,
    /** Prediction window bounds (± days around the expected date). */
    minWindowDays: 1,
    maxWindowDays: 5,
    /** Window shown while the app is still learning (fewer than 3 intervals). */
    learningWindowDays: 3,
    /** Minimum logged intervals before confidence is claimed. */
    minIntervalsForConfidence: 3,
  },
  storage: {
    key: 'cycle-companion-data',
    installDismissKey: 'cycle-companion-install-dismissed',
  },
  serviceWorker: {
    cacheName: 'cycle-companion-v16',
  },
  ui: {
    toastDurationMs: 2500,
    upcomingPeriodCount: 3,
    weekAheadDays: 7,
    installPrompt: {
      swipeThresholdPx: 48,
    },
    selectors: {
      main: '#main',
      toast: '#toast',
    },
  },
  validation: {
    datePattern: /^\d{4}-\d{2}-\d{2}$/,
  },
};

/** Static assets cached by the service worker for offline use. */
export const CACHE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.json',
  './js/app.js',
  './js/early-gate.js',
  './js/config.js',
  './js/lib/dates.js',
  './js/lib/cycle.js',
  './js/lib/storage.js',
  './js/content/tips.js',
  './js/content/phases.js',
  './js/ui/dom.js',
  './js/ui/toast.js',
  './js/ui/onboarding.js',
  './js/ui/dashboard.js',
  './js/ui/history.js',
  './js/ui/install-prompt.js',
  './js/lib/platform.js',
  './js/lib/profile.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];
