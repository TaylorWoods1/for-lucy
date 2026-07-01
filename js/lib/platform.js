import { CONFIG } from '../config.js';

/**
 * @returns {'ios' | 'android' | 'other'}
 */
export function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

/**
 * @returns {boolean} True when running on a phone or tablet (iOS or Android).
 */
export function isMobile() {
  return getPlatform() !== 'other';
}

/**
 * @returns {boolean} True when running as an installed PWA (not a browser tab).
 */
export function isStandalone() {
  if (typeof window.matchMedia === 'function') {
    // Safari 16.4+, Chrome, etc. — explicit browser tab must never pass.
    if (window.matchMedia('(display-mode: browser)').matches) {
      return false;
    }
  }

  const platform = getPlatform();
  const nav = /** @type {Navigator & { standalone?: boolean }} */ (navigator);

  if (platform === 'ios') {
    // iOS Safari: navigator.standalone is the canonical home-screen signal.
    if (nav.standalone === true) {
      return true;
    }
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  return window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * @returns {'none' | 'mobile' | 'install'} Why the app is blocked, if at all.
 */
export function getAccessBlockReason() {
  if (CONFIG.platform.requireMobile && !isMobile()) return 'mobile';
  if (CONFIG.pwa.requireInstall && !isStandalone()) return 'install';
  return 'none';
}

/**
 * @returns {boolean} True when the app is allowed to run.
 */
export function canUseApp() {
  return getAccessBlockReason() === 'none';
}

/**
 * @deprecated Use canUseApp() — kept for tests.
 * @param {boolean} _dismissed
 * @returns {boolean}
 */
export function shouldShowInstallPrompt(_dismissed = false) {
  return !canUseApp();
}

/**
 * @typedef {{ title: string, body: string, icon: string }} InstallStep
 */

/** @type {Record<'ios' | 'android' | 'other', InstallStep[]>} */
export const INSTALL_STEPS = {
  ios: [
    {
      title: 'Tap Share',
      body: 'Tap the Share button at the bottom of Safari.',
      icon: 'share',
    },
    {
      title: 'Add to Home Screen',
      body: 'Scroll the menu and tap "Add to Home Screen".',
      icon: 'add',
    },
    {
      title: 'Open from Home Screen',
      body: 'Tap Add — For Lucy will appear on your home screen like an app.',
      icon: 'home',
    },
  ],
  android: [
    {
      title: 'Open the menu',
      body: 'Tap the three-dot menu in the top-right of Chrome.',
      icon: 'menu',
    },
    {
      title: 'Install the app',
      body: 'Tap "Install app" or "Add to Home screen".',
      icon: 'add',
    },
    {
      title: 'Open from Home Screen',
      body: 'Confirm — then launch For Lucy from your home screen anytime.',
      icon: 'home',
    },
  ],
  other: [
    {
      title: 'Install For Lucy',
      body: 'Look for the install icon in your browser address bar.',
      icon: 'add',
    },
    {
      title: 'Or use on mobile',
      body: 'For the best experience, open this site in Safari or Chrome on your phone.',
      icon: 'home',
    },
  ],
};

/**
 * @param {'ios' | 'android' | 'other'} platform
 * @returns {InstallStep[]}
 */
export function getInstallSteps(platform) {
  return INSTALL_STEPS[platform] ?? INSTALL_STEPS.other;
}
