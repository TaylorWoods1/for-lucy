import { CONFIG } from '../config.js';
import { canUseApp, getAccessBlockReason, getInstallSteps, getPlatform } from '../lib/platform.js';
import { getAppTitle } from '../lib/profile.js';
import { escapeHtml } from './dom.js';

/**
 * Read whether the user dismissed the optional install tutorial.
 * @returns {boolean}
 */
function isDismissed() {
  try {
    return localStorage.getItem(CONFIG.storage.installDismissKey) === '1';
  } catch {
    return false;
  }
}

/**
 * Persist optional install tutorial dismissal.
 */
function setDismissed() {
  try {
    localStorage.setItem(CONFIG.storage.installDismissKey, '1');
  } catch {
    /* storage unavailable */
  }
}

/**
 * Build icon markup for a tutorial step.
 * @param {string} icon
 * @returns {string}
 */
function stepIconMarkup(icon) {
  const icons = {
    share:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10M12 3l4 4M12 3L8 7M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>',
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  };
  return icons[icon] ?? icons.home;
}

/**
 * Render tappable step indicators.
 * @param {ReturnType<typeof getInstallSteps>} steps
 * @param {number} activeIndex
 * @returns {string}
 */
function dotsMarkup(steps, activeIndex) {
  return steps
    .map(
      (step, index) => `
      <button
        type="button"
        class="install-dot${index === activeIndex ? ' install-dot--active' : ''}"
        data-step-index="${index}"
        aria-label="Step ${index + 1}: ${escapeHtml(step.title)}"
        aria-current="${index === activeIndex ? 'step' : 'false'}"
      ></button>
    `,
    )
    .join('');
}

/**
 * @param {ReturnType<typeof getInstallSteps>} steps
 * @returns {string}
 */
function stepsMarkup(steps) {
  return steps
    .map(
      (step, index) => `
      <article class="install-step${index === 0 ? ' install-step--active' : ''}" data-step="${index}">
        <div class="install-step__icon install-step__icon--${escapeHtml(step.icon)}">
          ${stepIconMarkup(step.icon)}
          <span class="install-step__pulse"></span>
        </div>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.body)}</p>
      </article>
    `,
    )
    .join('');
}

/**
 * Resolve slide direction when moving between steps (handles wrap-around).
 * @param {number} from
 * @param {number} to
 * @param {number} count
 * @returns {'forward' | 'back' | 'none'}
 */
function getDirection(from, to, count) {
  if (from === to) return 'none';
  const forward = (to - from + count) % count;
  const back = (from - to + count) % count;
  return forward <= back ? 'forward' : 'back';
}

/**
 * Show a step by index with directional animation.
 * @param {HTMLElement} overlay
 * @param {number} index
 * @param {'forward' | 'back' | 'none'} direction
 */
function showStep(overlay, index, direction = 'none') {
  const stepsContainer = overlay.querySelector('.install-steps');
  const steps = overlay.querySelectorAll('.install-step');
  const dots = overlay.querySelectorAll('.install-dot');

  if (stepsContainer) {
    stepsContainer.dataset.direction = direction;
  }

  steps.forEach((step, i) => {
    step.classList.toggle('install-step--active', i === index);
  });

  dots.forEach((dot, i) => {
    const isActive = i === index;
    dot.classList.toggle('install-dot--active', isActive);
    dot.setAttribute('aria-current', isActive ? 'step' : 'false');
  });
}

/**
 * Update the primary action button label for the current step.
 * @param {HTMLElement} overlay
 * @param {number} index
 * @param {number} stepCount
 * @param {boolean} enforced
 */
function updatePrimaryAction(overlay, index, stepCount, enforced) {
  const button = overlay.querySelector('.install-next');
  if (!button) return;

  const title = getAppTitle();
  const isLast = index >= stepCount - 1;
  if (enforced && isLast) {
    button.textContent = 'Open from Home Screen';
    button.setAttribute('aria-label', `Install complete — open ${title} from your home screen`);
    return;
  }

  button.textContent = isLast ? 'Got it' : 'Next';
  button.setAttribute('aria-label', isLast ? 'Dismiss tutorial' : 'Go to next step');
}

/**
 * Close and remove the optional install overlay.
 * @param {HTMLElement} overlay
 */
function closeOverlay(overlay) {
  overlay.classList.add('install-overlay--closing');
  overlay.addEventListener(
    'animationend',
    () => {
      overlay.remove();
    },
    { once: true },
  );
}

/**
 * Attach swipe handlers to the step carousel.
 * @param {HTMLElement} target
 * @param {(direction: 'forward' | 'back') => void} onSwipe
 */
function bindSwipeNavigation(target, onSwipe) {
  const threshold = CONFIG.ui.installPrompt.swipeThresholdPx;
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onStart = (x, y) => {
    startX = x;
    startY = y;
    tracking = true;
  };

  const onEnd = (x, y) => {
    if (!tracking) return;
    tracking = false;

    const deltaX = x - startX;
    const deltaY = y - startY;

    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) return;

    onSwipe(deltaX < 0 ? 'forward' : 'back');
  };

  target.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.changedTouches[0];
      onStart(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  target.addEventListener(
    'touchend',
    (event) => {
      const touch = event.changedTouches[0];
      onEnd(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  target.addEventListener('mousedown', (event) => {
    onStart(event.clientX, event.clientY);
  });

  target.addEventListener('mouseup', (event) => {
    onEnd(event.clientX, event.clientY);
  });
}

/**
 * Reload when the app opens in standalone mode after install.
 */
function watchForStandaloneLaunch() {
  const reloadIfStandalone = () => {
    if (canUseApp()) {
      window.location.reload();
    }
  };

  window.matchMedia('(display-mode: standalone)').addEventListener('change', reloadIfStandalone);
  window.matchMedia('(display-mode: fullscreen)').addEventListener('change', reloadIfStandalone);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      reloadIfStandalone();
    }
  });
}

/**
 * Hide the main app shell while the install gate is active.
 */
function blockAppShell() {
  document.querySelector('.app')?.classList.add('app--blocked');
  document.body.classList.add('body--install-gate');
}

/**
 * @param {boolean} enforced
 * @returns {boolean}
 */
function shouldShowInstallGate(enforced) {
  if (canUseApp()) return false;
  if (getAccessBlockReason() === 'mobile') return false;
  if (enforced) return true;
  return !isDismissed();
}

/**
 * Show a non-dismissible gate for desktop/non-mobile visitors.
 */
function showMobileOnlyGate() {
  const title = getAppTitle();

  const overlay = document.createElement('div');
  overlay.className = 'install-overlay install-overlay--enforced';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'mobile-only-title');
  overlay.innerHTML = `
    <div class="install-card">
      <div class="install-card__header install-card__header--centered">
        <span class="install-card__emoji" aria-hidden="true">📱</span>
        <h2 id="mobile-only-title">${escapeHtml(title)} is mobile-only</h2>
        <p class="install-card__lead">
          Open this site on your iPhone or Android phone in Safari or Chrome, then add it to your home screen.
        </p>
      </div>
      <p class="install-enforced-note">
        Desktop and laptop browsers are not supported.
      </p>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('install-overlay--visible'));
}

/**
 * Initialise access gates or the optional add-to-home-screen tutorial.
 */
export function initInstallPrompt() {
  if (canUseApp()) return;

  blockAppShell();

  if (getAccessBlockReason() === 'mobile') {
    showMobileOnlyGate();
    return;
  }

  const enforced = CONFIG.pwa.requireInstall;
  if (!shouldShowInstallGate(enforced)) return;

  const platform = getPlatform();
  const steps = getInstallSteps(platform);
  const title = getAppTitle();
  const stepCount = steps.length;

  const overlay = document.createElement('div');
  overlay.className = `install-overlay${enforced ? ' install-overlay--enforced' : ''}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'install-title');

  const closeButton = enforced
    ? ''
    : '<button type="button" class="install-close" aria-label="Dismiss tutorial">&times;</button>';

  const leadCopy = enforced
    ? `${title} only works as an installed app — add it to your home screen to continue.`
    : 'Install once — open like a real app, even offline.';

  const nativeInstallButton =
    platform === 'android'
      ? '<button type="button" class="btn btn-secondary install-native" hidden>Install app</button>'
      : '';

  const enforcedNote = enforced
    ? `<p class="install-enforced-note">Browser access is disabled until you open ${escapeHtml(title)} from your home screen.</p>`
    : '';

  overlay.innerHTML = `
    <div class="install-card">
      ${closeButton}
      <div class="install-card__header${enforced ? ' install-card__header--centered' : ''}">
        <span class="install-card__emoji" aria-hidden="true">📲</span>
        <h2 id="install-title">${enforced ? 'Install' : 'Add'} ${escapeHtml(title)} to your Home Screen</h2>
        <p class="install-card__lead">${leadCopy}</p>
      </div>
      <div class="install-phone" aria-hidden="true">
        <div class="install-phone__screen">
          <div class="install-phone__bar"></div>
          <div class="install-phone__content"></div>
        </div>
        <div class="install-phone__tap"></div>
      </div>
      <div class="install-steps" tabindex="0" aria-roledescription="carousel" aria-label="Install steps">
        ${stepsMarkup(steps)}
      </div>
      <p class="install-swipe-hint">Swipe or tap a dot to change step</p>
      <div class="install-dots" role="tablist" aria-label="Choose install step">${dotsMarkup(steps, 0)}</div>
      ${nativeInstallButton}
      <button type="button" class="btn btn-primary install-next" aria-label="Go to next step">Next</button>
      ${enforcedNote}
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('install-overlay--visible'));

  let activeStep = 0;
  /** @type {BeforeInstallPromptEvent | null} */
  let deferredPrompt = null;

  const goToStep = (index) => {
    const nextIndex = ((index % stepCount) + stepCount) % stepCount;
    const direction = getDirection(activeStep, nextIndex, stepCount);
    activeStep = nextIndex;
    showStep(overlay, activeStep, direction);
    updatePrimaryAction(overlay, activeStep, stepCount, enforced);
  };

  updatePrimaryAction(overlay, activeStep, stepCount, enforced);

  overlay.querySelectorAll('.install-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.getAttribute('data-step-index'));
      if (!Number.isNaN(index)) goToStep(index);
    });
  });

  const stepsEl = overlay.querySelector('.install-steps');
  if (stepsEl) {
    bindSwipeNavigation(stepsEl, (direction) => {
      goToStep(activeStep + (direction === 'forward' ? 1 : -1));
    });

    stepsEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToStep(activeStep + 1);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToStep(activeStep - 1);
      }
    });
  }

  const dismiss = () => {
    if (enforced) return;
    setDismissed();
    closeOverlay(overlay);
  };

  overlay.querySelector('.install-close')?.addEventListener('click', dismiss);
  overlay.querySelector('.install-next')?.addEventListener('click', () => {
    if (activeStep >= stepCount - 1) {
      if (enforced) return;
      dismiss();
      return;
    }
    goToStep(activeStep + 1);
  });

  if (!enforced) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) dismiss();
    });
  }

  const nativeButton = overlay.querySelector('.install-native');
  if (nativeButton) {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      nativeButton.hidden = false;
    });

    nativeButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      nativeButton.hidden = true;
    });
  }

  if (enforced) {
    watchForStandaloneLaunch();
  }
}
