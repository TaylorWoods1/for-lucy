/**
 * Platform detection for install prompt and PWA behaviour.
 */

/**
 * @returns {boolean} True when running as an installed PWA.
 */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    /** @type {Window & { navigator: Navigator & { standalone?: boolean } }} */ (window).navigator
      .standalone === true
  );
}

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
 * @param {boolean} dismissed
 * @returns {boolean}
 */
export function shouldShowInstallPrompt(dismissed) {
  return !isStandalone() && !dismissed;
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
