import { CONFIG } from '../config.js';
import Storage from '../lib/storage.js';
import { getUpcomingPeriods } from '../lib/cycle.js';
import { todayISO, isValidDateISO } from '../lib/dates.js';
import { getTipsForPhase } from '../content/tips.js';
import { $, escapeHtml, htmlList } from './dom.js';
import { showToast } from './toast.js';

const { name } = CONFIG.app;

/**
 * Render the main dashboard with phase, predictions, and tips.
 * @param {object} state
 * @param {Array<{ startDate: string }>} cycles
 * @param {{ defaultCycleLength: number, defaultPeriodLength: number }} settings
 * @param {() => void} onUpdate
 */
export function renderDashboard(state, cycles, settings, onUpdate) {
  const tips = getTipsForPhase(state.phase);
  const upcoming = getUpcomingPeriods(cycles, settings);
  const main = $(CONFIG.ui.selectors.main);
  if (!main) return;

  const countdownHtml = state.isOverdue
    ? `<span class="overdue">${escapeHtml(name)}'s period may start <strong>any day now</strong></span>`
    : `About <strong>${state.daysUntil}</strong> day${state.daysUntil === 1 ? '' : 's'} until ${escapeHtml(name)}'s next period`;

  const nextExpectedHtml = upcoming.isOverdue
    ? `<p class="prediction-primary prediction-primary--overdue">Next expected: <strong>${escapeHtml(upcoming.next.label)}</strong></p>`
    : `<p class="prediction-primary">Next expected: <strong>${escapeHtml(upcoming.next.label)}</strong></p>`;

  const upcomingHtml = upcoming.upcoming.length
    ? `<ul class="prediction-list">${upcoming.upcoming
        .map((p) => `<li><span>${escapeHtml(p.label)}</span><span>${p.daysUntil} days</span></li>`)
        .join('')}</ul>`
    : '';

  const metaParts = [];
  if (state.learnedCycle) metaParts.push(`${state.learnedCycle}-day avg cycle`);
  else metaParts.push(`${CONFIG.defaults.cycleLength}-day default cycle`);
  if (state.learnedPeriod) metaParts.push(`${state.learnedPeriod}-day avg period`);

  main.innerHTML = `
    <section class="phase-card">
      <div class="phase-badge ${escapeHtml(state.phase)}">${escapeHtml(state.phaseLabel)} phase</div>
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

    <section class="predictions-card">
      <h2>Upcoming periods</h2>
      ${nextExpectedHtml}
      <p class="prediction-basis">Based on ${escapeHtml(upcoming.basisLabel)} · updates as you log more starts</p>
      ${upcomingHtml ? `<p class="prediction-subhead">Then</p>${upcomingHtml}` : ''}
    </section>

    <section class="tips-card">
      <h2>How to show up for ${escapeHtml(name)} today</h2>
      <ul>${htmlList(tips)}</ul>
    </section>

    <div class="actions">
      <button class="btn btn-primary" id="btn-log-today" type="button">Period started today</button>
      <button class="btn btn-secondary" id="btn-log-past" type="button">Log a different date</button>
    </div>
    <p class="meta">${escapeHtml(metaParts.join(' · '))}</p>
  `;

  $('#btn-log-today')?.addEventListener('click', () => {
    Storage.saveCycle({ startDate: todayISO() });
    showToast('Period start logged');
    onUpdate();
  });

  $('#btn-log-past')?.addEventListener('click', () => {
    const date = prompt('Enter period start date (YYYY-MM-DD):', todayISO());
    if (!date || !isValidDateISO(date)) return;
    Storage.saveCycle({ startDate: date });
    showToast('Period start saved');
    onUpdate();
  });
}
