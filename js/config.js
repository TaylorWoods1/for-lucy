/**
 * Central application configuration.
 * Single source of truth for personalization, defaults, and runtime constants.
 */
export const CONFIG = {
  app: {
    name: 'Lucy',
    title: 'For Lucy',
    tagline: 'Show up when it matters most',
    description: "Track Lucy's cycle phases and get supportive partner tips.",
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
  storage: {
    key: 'cycle-companion-data',
    installDismissKey: 'for-lucy-install-dismissed',
  },
  serviceWorker: {
    cacheName: 'cycle-companion-v12',
  },
  ui: {
    toastDurationMs: 2500,
    upcomingPeriodCount: 3,
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
  './js/ui/dom.js',
  './js/ui/toast.js',
  './js/ui/onboarding.js',
  './js/ui/dashboard.js',
  './js/ui/install-prompt.js',
  './js/lib/platform.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];
