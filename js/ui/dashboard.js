import { CONFIG } from '../config.js';
import Storage from '../lib/storage.js';
import { getUpcomingPeriods, getWeekAhead } from '../lib/cycle.js';
import { todayISO, isValidDateISO } from '../lib/dates.js';
import { getTipsForPhase } from '../content/tips.js';
import { $, escapeHtml, htmlList } from './dom.js';
import { showToast } from './toast.js';
import { historyPanelsHtml, bindHistoryPanels } from './history.js';

const { name } = CONFIG.app;

/**
 * Copy explaining prediction confidence for the current history.
 * @param {{ level: string, windowDays: number }} confidence
 * @returns {string}
 */
function confidenceCopy(confidence) {
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
  const tips = getTipsForPhase(state.phase, state.cycleDay);
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

  const isActivePeriod = state.phase === 'period' && !state.latestHasEnd;
  const primaryAction = isActivePeriod
    ? {
        id: 'btn-log-today',
        label: 'Period ended today',
        mode: 'end',
      }
    : {
        id: 'btn-log-today',
        label: 'Period started today',
        mode: 'start',
      };
  const otherDateLabel = isActivePeriod ? 'When did it end?' : 'When did it start?';

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
      <p class="prediction-basis">${escapeHtml(confidenceCopy(upcoming.confidence))} Based on ${escapeHtml(upcoming.basisLabel)}.</p>
      ${accuracyHtml(upcoming.accuracy)}
      ${upcomingHtml ? `<p class="prediction-subhead">Then</p>${upcomingHtml}` : ''}
    </section>

    ${weekAheadHtml(week)}

    <section class="tips-card">
      <h2>How to show up for ${escapeHtml(name)} today</h2>
      <p class="tip-focus"><span class="tip-focus__label">Today's focus</span>${escapeHtml(tips[0])}</p>
      <ul>${htmlList(tips.slice(1))}</ul>
    </section>

    <section class="log-card">
      <p class="log-card__prompt">${isActivePeriod ? 'Still on her period?' : 'Has her period started?'}</p>
      <div class="actions">
        <button class="btn btn-primary" id="${primaryAction.id}" type="button" data-log-mode="${primaryAction.mode}">${escapeHtml(primaryAction.label)}</button>
        <button class="log-card__other" id="btn-log-other" type="button" aria-expanded="false">Not today? Pick a date</button>
        <div class="log-form" id="log-form" hidden>
          <label class="log-form__label" for="log-date">${escapeHtml(otherDateLabel)}</label>
          <div class="log-form__row">
            <input type="date" id="log-date" class="date-input" value="${today}" max="${today}"${isActivePeriod ? ` min="${escapeHtml(state.lastStart)}"` : ''}>
            <button class="btn btn-primary" id="btn-save-date" type="button" data-log-mode="${primaryAction.mode}">Save</button>
          </div>
        </div>
      </div>
    </section>

    ${historyPanelsHtml(cycles)}

    <p class="meta">${escapeHtml(metaParts.join(' · '))}</p>
  `;

  $('#btn-log-today')?.addEventListener('click', (event) => {
    const mode = /** @type {HTMLButtonElement} */ (event.currentTarget).dataset.logMode;
    const today = todayISO();
    if (mode === 'end') {
      if (Storage.setPeriodEnd(state.lastStart, today)) {
        showToast('Period end logged');
        onUpdate();
      }
      return;
    }
    Storage.saveCycle({ startDate: today });
    showToast('Period start logged');
    onUpdate();
  });

  const otherToggle = $('#btn-log-other');
  const logForm = $('#log-form');
  otherToggle?.addEventListener('click', () => {
    const isHidden = logForm?.hasAttribute('hidden');
    if (isHidden) {
      logForm?.removeAttribute('hidden');
      otherToggle.setAttribute('aria-expanded', 'true');
      /** @type {HTMLInputElement | null} */ ($('#log-date'))?.focus();
    } else {
      logForm?.setAttribute('hidden', '');
      otherToggle.setAttribute('aria-expanded', 'false');
    }
  });

  $('#btn-save-date')?.addEventListener('click', (event) => {
    const mode = /** @type {HTMLButtonElement} */ (event.currentTarget).dataset.logMode;
    const input = /** @type {HTMLInputElement | null} */ ($('#log-date'));
    const date = input?.value;
    const today = todayISO();
    if (!date || !isValidDateISO(date) || date > today) {
      showToast('Pick a valid date (not in the future)');
      return;
    }
    if (mode === 'end') {
      if (date < state.lastStart) {
        showToast('End date must be on or after the start date');
        return;
      }
      if (Storage.setPeriodEnd(state.lastStart, date)) {
        showToast('Period end saved');
        onUpdate();
      }
      return;
    }
    Storage.saveCycle({ startDate: date });
    showToast('Period start saved');
    onUpdate();
  });

  bindHistoryPanels(main, onUpdate);
}
