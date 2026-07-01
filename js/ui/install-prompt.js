import { CONFIG } from '../config.js';
import { getInstallSteps, getPlatform, shouldShowInstallPrompt } from '../lib/platform.js';
import { escapeHtml } from './dom.js';

const STEP_INTERVAL_MS = 3200;

/** @type {ReturnType<typeof setInterval> | null} */
let stepTimer = null;

/**
 * Read whether the user dismissed the install tutorial.
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
 * Persist install tutorial dismissal.
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
 * Render step indicators.
 * @param {number} count
 * @param {number} activeIndex
 * @returns {string}
 */
function dotsMarkup(count, activeIndex) {
  return Array.from(
    { length: count },
    (_, i) => `<span class="install-dot${i === activeIndex ? ' install-dot--active' : ''}"></span>`,
  ).join('');
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
 * Show a step by index with animation.
 * @param {HTMLElement} overlay
 * @param {number} index
 */
function showStep(overlay, index) {
  const steps = overlay.querySelectorAll('.install-step');
  const dots = overlay.querySelectorAll('.install-dot');
  steps.forEach((step, i) => {
    step.classList.toggle('install-step--active', i === index);
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle('install-dot--active', i === index);
  });
}

/**
 * Close and remove the install overlay.
 * @param {HTMLElement} overlay
 */
function closeOverlay(overlay) {
  if (stepTimer) {
    clearInterval(stepTimer);
    stepTimer = null;
  }
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
 * Initialise the add-to-home-screen tutorial for browser users.
 */
export function initInstallPrompt() {
  if (!shouldShowInstallPrompt(isDismissed())) return;

  const platform = getPlatform();
  const steps = getInstallSteps(platform);
  const { title } = CONFIG.app;

  const overlay = document.createElement('div');
  overlay.className = 'install-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'install-title');
  overlay.innerHTML = `
    <div class="install-card">
      <button type="button" class="install-close" aria-label="Dismiss tutorial">&times;</button>
      <div class="install-card__header">
        <span class="install-card__emoji" aria-hidden="true">📲</span>
        <h2 id="install-title">Add ${escapeHtml(title)} to your Home Screen</h2>
        <p class="install-card__lead">Install once — open like a real app, even offline.</p>
      </div>
      <div class="install-phone" aria-hidden="true">
        <div class="install-phone__screen">
          <div class="install-phone__bar"></div>
          <div class="install-phone__content"></div>
        </div>
        <div class="install-phone__tap"></div>
      </div>
      <div class="install-steps">${stepsMarkup(steps)}</div>
      <div class="install-dots">${dotsMarkup(steps.length, 0)}</div>
      <button type="button" class="btn btn-primary install-got-it">Got it</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('install-overlay--visible'));

  let activeStep = 0;
  stepTimer = setInterval(() => {
    activeStep = (activeStep + 1) % steps.length;
    showStep(overlay, activeStep);
  }, STEP_INTERVAL_MS);

  const dismiss = () => {
    setDismissed();
    closeOverlay(overlay);
  };

  overlay.querySelector('.install-close')?.addEventListener('click', dismiss);
  overlay.querySelector('.install-got-it')?.addEventListener('click', dismiss);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) dismiss();
  });
}
