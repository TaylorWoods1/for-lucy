import { CONFIG } from '../config.js';
import Storage from '../lib/storage.js';
import { todayISO } from '../lib/dates.js';
import { applyBranding, getPartnerName, normalizePartnerName } from '../lib/profile.js';
import { $, escapeHtml } from './dom.js';
import { showToast } from './toast.js';

/**
 * Render first-run onboarding when no cycles are logged.
 * @param {() => void} onComplete
 */
export function renderOnboarding(onComplete) {
  const today = todayISO();
  const main = $(CONFIG.ui.selectors.main);
  if (!main) return;

  const savedName = Storage.getSettings().partnerName;

  main.innerHTML = `
    <div class="onboarding">
      <h2>Let's get started</h2>
      <p>Who is this for? You'll see cycle phases and partner tips personalized to her.</p>
      <label for="partner-name" class="field-label">Her name</label>
      <input
        type="text"
        id="partner-name"
        class="text-input"
        value="${escapeHtml(savedName)}"
        maxlength="40"
        autocomplete="off"
        autocapitalize="words"
        placeholder="e.g. Lucy"
        required
      >
      <label for="start-date" class="field-label">When did her last period start?</label>
      <div class="date-input-wrap">
        <input type="date" id="start-date" class="date-input" value="${today}" max="${today}">
      </div>
      <button class="btn btn-primary" id="btn-save-start" type="button">Save and continue</button>
    </div>
  `;

  $('#btn-save-start')?.addEventListener('click', () => {
    const nameInput = /** @type {HTMLInputElement | null} */ ($('#partner-name'));
    const dateInput = /** @type {HTMLInputElement | null} */ ($('#start-date'));
    const name = normalizePartnerName(nameInput?.value ?? '');
    const date = dateInput?.value;

    if (!name) {
      showToast('Enter her name to continue');
      nameInput?.focus();
      return;
    }
    if (!date) return;

    Storage.saveSettings({ partnerName: name });
    applyBranding();
    Storage.saveCycle({ startDate: date });
    showToast('All set — welcome!');
    onComplete();
  });
}

/**
 * Render a lightweight name editor when cycles exist but no name was saved yet.
 * @param {() => void} onComplete
 */
export function renderNameSetup(onComplete) {
  const main = $(CONFIG.ui.selectors.main);
  if (!main) return;

  main.innerHTML = `
    <div class="onboarding">
      <h2>Who is this for?</h2>
      <p>Add her name so tips and predictions feel personal.</p>
      <label for="partner-name" class="field-label">Her name</label>
      <input
        type="text"
        id="partner-name"
        class="text-input"
        maxlength="40"
        autocomplete="off"
        autocapitalize="words"
        placeholder="e.g. Lucy"
        required
      >
      <button class="btn btn-primary" id="btn-save-name" type="button">Save name</button>
    </div>
  `;

  $('#btn-save-name')?.addEventListener('click', () => {
    const nameInput = /** @type {HTMLInputElement | null} */ ($('#partner-name'));
    const name = normalizePartnerName(nameInput?.value ?? '');
    if (!name) {
      showToast('Enter her name to continue');
      nameInput?.focus();
      return;
    }

    Storage.saveSettings({ partnerName: name });
    applyBranding();
    showToast(`Now tracking for ${name}`);
    onComplete();
  });
}

/**
 * Settings panel markup for editing the partner name later.
 * @returns {string}
 */
export function personalizationPanelHtml() {
  const name = Storage.getSettings().partnerName;

  return `
    <details class="panel panel--personalization">
      <summary>Personalization</summary>
      <div class="panel-body">
        <p class="panel-hint">Change how the app addresses your partner across tips and predictions.</p>
        <label for="settings-partner-name" class="field-label">Her name</label>
        <input
          type="text"
          id="settings-partner-name"
          class="text-input"
          value="${escapeHtml(name)}"
          maxlength="40"
          autocomplete="off"
          autocapitalize="words"
          enterkeyhint="done"
          inputmode="text"
          placeholder="e.g. Lucy"
        >
        <button type="button" class="btn btn-secondary panel-action" id="btn-save-partner-name">Save name</button>
      </div>
    </details>
  `;
}

/**
 * @param {Element} root
 * @param {() => void} onUpdate
 */
export function bindPersonalizationPanel(root, onUpdate) {
  root.querySelector('#btn-save-partner-name')?.addEventListener('click', () => {
    const input = /** @type {HTMLInputElement | null} */ (
      root.querySelector('#settings-partner-name')
    );
    const name = normalizePartnerName(input?.value ?? '');
    if (!name) {
      showToast('Enter a valid name');
      input?.focus();
      return;
    }

    const previous = getPartnerName();
    Storage.saveSettings({ partnerName: name });
    applyBranding();
    showToast(previous === name ? 'Name saved' : `Updated to ${name}`);
    onUpdate();
  });
}
