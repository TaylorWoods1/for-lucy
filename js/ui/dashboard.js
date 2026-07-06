import { CONFIG } from '../config.js';
import Storage from '../lib/storage.js';
import { getUpcomingPeriods, getWeekAhead } from '../lib/cycle.js';
import { todayISO, isValidDateISO } from '../lib/dates.js';
import { getPartnerName } from '../lib/profile.js';
import { getTipsForPhase } from '../content/tips.js';
import { $, escapeHtml, htmlList } from './dom.js';
import { showToast } from './toast.js';
import { historyPanelsHtml, bindHistoryPanels } from './history.js';
import { personalizationPanelHtml, bindPersonalizationPanel } from './onboarding.js';

/**
 * Copy explaining prediction confidence for the current history.
 * @param {{ level: string, windowDays: number }} confidence
 * @param {string} name
 * @returns {string}
 */
function confidenceCopy(confidence, name) {
  if (confidence.level === 'regular') return `${name}'s cycles are quite regular.`;
  if (confidence.level === 'variable')
    return `${name}'s cycles vary a bit — treat the date as a window.`;
  return 'Still learning her rhythm — the window narrows with every logged cycle.';
}

/**
 * Self-reported accuracy line, shown once enough history exists.
 * @param {{ count: number, withinDays: number } | null} accuracy
 * @returns {string}
 */
function accuracyHtml(accuracy) {
  if (!accuracy) return '';
  const copy =
    accuracy.withinDays === 0
      ? `Last ${accuracy.count} predictions were spot on.`
      : `Last ${accuracy.count} predictions landed within ±${accuracy.withinDays} day${accuracy.withinDays === 1 ? '' : 's'}.`;
  return `<p class="prediction-accuracy">${escapeHtml(copy)}</p>`;
}

/**
 * Seven-day phase outlook strip with transition callout.
 * @param {ReturnType<typeof getWeekAhead>} week
 * @returns {string}
 */
function weekAheadHtml(week) {
  if (!week) return '';

  const daysHtml = week.days
    .map(
      (day) => `
      <div class="week-day${day.isToday ? ' week-day--today' : ''}" title="${escapeHtml(day.phaseLabel)}">
        <span class="week-day__name">${escapeHtml(day.weekday.slice(0, 2))}</span>
        <span class="week-day__dot phase-dot phase-dot--${escapeHtml(day.phase)}"></span>
      </div>
    `,
    )
    .join('');

  let callout;
  if (week.transition) {
    const t = week.transition;
    const when = t.inDays === 1 ? 'tomorrow' : `${t.weekday} (in ${t.inDays} days)`;
    callout = `<p class="week-callout"><strong>${escapeHtml(t.phaseLabel)}</strong> phase likely starts ${escapeHtml(when)}</p>`;
  } else {
    callout = `<p class="week-callout week-callout--calm">No phase change expected this week</p>`;
  }

  return `
    <section class="week-card">
      <h2>The week ahead</h2>
      <div class="week-strip">${daysHtml}</div>
      ${callout}
    </section>
  `;
}

/**
 * Render the main dashboard with phase, predictions, outlook, and tips.
 * @param {object} state
 * @param {Array<{ startDate: string, endDate?: string }>} cycles
 * @param {{ defaultCycleLength: number, defaultPeriodLength: number }} settings
 * @param {() => void} onUpdate
 */
export function renderDashboard(state, cycles, settings, onUpdate) {
  const name = getPartnerName();
  const tips = getTipsForPhase(state.phase, state.cycleDay, name);
  const upcoming = getUpcomingPeriods(cycles, settings);
  const week = getWeekAhead(cycles, settings);
  const main = $(CONFIG.ui.selectors.main);
  if (!main) return;

  const today = todayISO();
  const windowDays = upcoming.confidence.windowDays;
  const rangeChip = `<span class="range-chip">&plusmn; ${windowDays} day${windowDays === 1 ? '' : 's'}</span>`;

  const countdownHtml = state.isOverdue
    ? `<span class="overdue">${escapeHtml(name)}'s period may start <strong>any day now</strong></span>`
    : `About <strong>${state.daysUntil}</strong> day${state.daysUntil === 1 ? '' : 's'} until ${escapeHtml(name)}'s next period`;

  const nextExpectedHtml = `<p class="prediction-primary${upcoming.isOverdue ? ' prediction-primary--overdue' : ''}">Next expected: <strong>${escapeHtml(upcoming.next.label)}</strong> ${rangeChip}</p>`;

  const upcomingHtml = upcoming.upcoming.length
    ? `<ul class="prediction-list">${upcoming.upcoming
        .map((p) => `<li><span>${escapeHtml(p.label)}</span><span>${p.daysUntil} days</span></li>`)
        .join('')}</ul>`
    : '';

  const showEndButton = state.phase === 'period' && !state.latestHasEnd;
  const endButtonHtml = showEndButton
    ? '<button class="btn btn-secondary" id="btn-end-today" type="button">Period ended today</button>'
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
      <p class="prediction-basis">${escapeHtml(confidenceCopy(upcoming.confidence, name))} Based on ${escapeHtml(upcoming.basisLabel)}.</p>
      ${accuracyHtml(upcoming.accuracy)}
      ${upcomingHtml ? `<p class="prediction-subhead">Then</p>${upcomingHtml}` : ''}
    </section>

    ${weekAheadHtml(week)}

    <section class="tips-card">
      <h2>How to show up for ${escapeHtml(name)} today</h2>
      <p class="tip-focus"><span class="tip-focus__label">Today's focus</span>${escapeHtml(tips[0])}</p>
      <ul>${htmlList(tips.slice(1))}</ul>
    </section>

    <div class="actions">
      <button class="btn btn-primary" id="btn-log-today" type="button">Period started today</button>
      ${endButtonHtml}
      <button class="btn btn-secondary" id="btn-log-past" type="button" aria-expanded="false">Log a different date</button>
      <div class="past-form" id="past-form" hidden>
        <label class="sr-only" for="past-date">Period start date</label>
        <input type="date" id="past-date" class="date-input" value="${today}" max="${today}">
        <button class="btn btn-primary" id="btn-save-past" type="button">Save</button>
      </div>
    </div>

    ${personalizationPanelHtml()}
    ${historyPanelsHtml(cycles)}

    <p class="meta">${escapeHtml(metaParts.join(' · '))}</p>
  `;

  $('#btn-log-today')?.addEventListener('click', () => {
    Storage.saveCycle({ startDate: todayISO() });
    showToast('Period start logged');
    onUpdate();
  });

  $('#btn-end-today')?.addEventListener('click', () => {
    if (Storage.setPeriodEnd(state.lastStart, todayISO())) {
      showToast('Period end logged');
      onUpdate();
    }
  });

  const pastToggle = $('#btn-log-past');
  const pastForm = $('#past-form');
  pastToggle?.addEventListener('click', () => {
    const isHidden = pastForm?.hasAttribute('hidden');
    if (isHidden) {
      pastForm?.removeAttribute('hidden');
      pastToggle.setAttribute('aria-expanded', 'true');
      /** @type {HTMLInputElement | null} */ ($('#past-date'))?.focus();
    } else {
      pastForm?.setAttribute('hidden', '');
      pastToggle.setAttribute('aria-expanded', 'false');
    }
  });

  $('#btn-save-past')?.addEventListener('click', () => {
    const input = /** @type {HTMLInputElement | null} */ ($('#past-date'));
    const date = input?.value;
    if (!date || !isValidDateISO(date) || date > todayISO()) {
      showToast('Pick a valid date (not in the future)');
      return;
    }
    Storage.saveCycle({ startDate: date });
    showToast('Period start saved');
    onUpdate();
  });

  bindHistoryPanels(main, onUpdate);
  bindPersonalizationPanel(main, onUpdate);
}
