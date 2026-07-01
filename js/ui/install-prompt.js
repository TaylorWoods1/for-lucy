import { CONFIG } from '../config.js';
import { getInstallSteps, getPlatform, shouldShowInstallPrompt } from '../lib/platform.js';
import { escapeHtml } from './dom.js';

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
 */
function updatePrimaryAction(overlay, index, stepCount) {
  const button = overlay.querySelector('.install-next');
  if (!button) return;

  const isLast = index >= stepCount - 1;
  button.textContent = isLast ? 'Got it' : 'Next';
  button.setAttribute('aria-label', isLast ? 'Dismiss tutorial' : 'Go to next step');
}

/**
 * Close and remove the install overlay.
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
 * Initialise the add-to-home-screen tutorial for browser users.
 */
export function initInstallPrompt() {
  if (!shouldShowInstallPrompt(isDismissed())) return;

  const platform = getPlatform();
  const steps = getInstallSteps(platform);
  const { title } = CONFIG.app;
  const stepCount = steps.length;

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
      <div class="install-steps" tabindex="0" aria-roledescription="carousel" aria-label="Install steps">
        ${stepsMarkup(steps)}
      </div>
      <p class="install-swipe-hint">Swipe or tap a dot to change step</p>
      <div class="install-dots" role="tablist" aria-label="Choose install step">${dotsMarkup(steps, 0)}</div>
      <button type="button" class="btn btn-primary install-next" aria-label="Go to next step">Next</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('install-overlay--visible'));

  let activeStep = 0;

  const goToStep = (index) => {
    const nextIndex = ((index % stepCount) + stepCount) % stepCount;
    const direction = getDirection(activeStep, nextIndex, stepCount);
    activeStep = nextIndex;
    showStep(overlay, activeStep, direction);
    updatePrimaryAction(overlay, activeStep, stepCount);
  };

  updatePrimaryAction(overlay, activeStep, stepCount);

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
    setDismissed();
    closeOverlay(overlay);
  };

  overlay.querySelector('.install-close')?.addEventListener('click', dismiss);
  overlay.querySelector('.install-next')?.addEventListener('click', () => {
    if (activeStep >= stepCount - 1) {
      dismiss();
      return;
    }
    goToStep(activeStep + 1);
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) dismiss();
  });
}
