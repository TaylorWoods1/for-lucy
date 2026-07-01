import Storage from './storage.js';
import { getCycleState, formatDateISO } from './cycle.js';
import { getTipsForPhase } from './tips.js';
import { CONFIG } from './config.js';

const { name } = CONFIG;

const $ = (sel) => document.querySelector(sel);

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function renderOnboarding() {
  const today = formatDateISO(new Date());
  $('#main').innerHTML = `
    <div class="onboarding">
      <h2>Hey — let's track ${name}'s cycle</h2>
      <p>Log when ${name}'s last period started. You'll see where she is in her cycle and get tips on how to show up for her.</p>
      <label for="start-date" class="sr-only">Period start date</label>
      <div class="date-input-wrap">
        <input type="date" id="start-date" class="date-input" value="${today}" max="${today}">
      </div>
      <button class="btn btn-primary" id="btn-save-start">Save period start</button>
    </div>
  `;

  $('#btn-save-start').addEventListener('click', () => {
    const date = $('#start-date').value;
    if (!date) return;
    Storage.saveCycle({ startDate: date });
    showToast('Period start saved');
    render();
  });
}

function renderDashboard(state) {
  const tips = getTipsForPhase(state.phase);
  const tipsHtml = tips.map((t) => `<li>${t}</li>`).join('');

  const countdownHtml = state.isOverdue
    ? `<span class="overdue">${name}'s period may start <strong>any day now</strong></span>`
    : `About <strong>${state.daysUntil}</strong> day${state.daysUntil === 1 ? '' : 's'} until ${name}'s next period`;

  const metaParts = [];
  if (state.learnedCycle) metaParts.push(`${state.learnedCycle}-day avg cycle`);
  else metaParts.push('28-day default cycle');
  if (state.learnedPeriod) metaParts.push(`${state.learnedPeriod}-day avg period`);

  $('#main').innerHTML = `
    <section class="phase-card">
      <div class="phase-badge ${state.phase}">${state.phaseLabel} phase</div>
      <div class="cycle-day">
        Day ${state.cycleDay}
        <span>of ~${state.cycleLength}</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${state.progress}%"></div>
        </div>
      </div>
      <p class="countdown">${countdownHtml}</p>
    </section>

    <section class="tips-card">
      <h2>How to show up for ${name} today</h2>
      <ul>${tipsHtml}</ul>
    </section>

    <div class="actions">
      <button class="btn btn-primary" id="btn-log-today">Period started today</button>
      <button class="btn btn-secondary" id="btn-log-past">Log a different date</button>
    </div>
    <p class="meta">${metaParts.join(' · ')}</p>
  `;

  $('#btn-log-today').addEventListener('click', () => {
    const today = formatDateISO(new Date());
    Storage.saveCycle({ startDate: today });
    showToast('Period start logged');
    render();
  });

  $('#btn-log-past').addEventListener('click', () => {
    const date = prompt('Enter period start date (YYYY-MM-DD):', formatDateISO(new Date()));
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    Storage.saveCycle({ startDate: date });
    showToast('Period start saved');
    render();
  });
}

function render() {
  const cycles = Storage.getCycles();
  const settings = Storage.getSettings();

  if (!cycles.length) {
    renderOnboarding();
    return;
  }

  const state = getCycleState(cycles, settings);
  renderDashboard(state);
}

document.addEventListener('DOMContentLoaded', () => {
  render();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
