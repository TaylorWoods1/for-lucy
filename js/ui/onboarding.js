import { CONFIG } from '../config.js';
import Storage from '../lib/storage.js';
import { todayISO } from '../lib/dates.js';
import { $ } from './dom.js';
import { showToast } from './toast.js';

const { name } = CONFIG.app;

/**
 * Render first-run onboarding when no cycles are logged.
 * @param {() => void} onComplete
 */
export function renderOnboarding(onComplete) {
  const today = todayISO();
  const main = $(CONFIG.ui.selectors.main);
  if (!main) return;

  main.innerHTML = `
    <div class="onboarding">
      <h2>Hey — let's track ${name}'s cycle</h2>
      <p>Log when ${name}'s last period started. You'll see where she is in her cycle and get tips on how to show up for her.</p>
      <label for="start-date" class="sr-only">Period start date</label>
      <div class="date-input-wrap">
        <input type="date" id="start-date" class="date-input" value="${today}" max="${today}">
      </div>
      <button class="btn btn-primary" id="btn-save-start" type="button">Save period start</button>
    </div>
  `;

  $('#btn-save-start')?.addEventListener('click', () => {
    const input = /** @type {HTMLInputElement | null} */ ($('#start-date'));
    const date = input?.value;
    if (!date) return;
    Storage.saveCycle({ startDate: date });
    showToast('Period start saved');
    onComplete();
  });
}
