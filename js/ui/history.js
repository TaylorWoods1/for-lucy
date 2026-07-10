import Storage from '../lib/storage.js';
import { formatDisplayDate, todayISO, isValidDateISO } from '../lib/dates.js';
import { escapeHtml } from './dom.js';
import { showToast } from './toast.js';

/**
 * Collapsible history and data-management panels shown under the dashboard.
 * @param {Array<{ startDate: string, endDate?: string }>} cycles
 * @returns {string}
 */
export function historyPanelsHtml(cycles) {
  const items = [...cycles]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .map((cycle) => {
      const range = cycle.endDate
        ? `${formatDisplayDate(cycle.startDate)} &ndash; ${formatDisplayDate(cycle.endDate)}`
        : formatDisplayDate(cycle.startDate);
      return `
        <li class="history-item" data-cycle-start="${escapeHtml(cycle.startDate)}">
          <div class="history-item__main">
            <span class="history-item__range">${range}</span>
            <div class="history-item__actions">
              <button
                type="button"
                class="link-action"
                data-edit-cycle="${escapeHtml(cycle.startDate)}"
                aria-label="Change start date for ${escapeHtml(formatDisplayDate(cycle.startDate))}"
              >Change date</button>
              <button
                type="button"
                class="link-danger"
                data-delete-cycle="${escapeHtml(cycle.startDate)}"
                aria-label="Remove entry from ${escapeHtml(formatDisplayDate(cycle.startDate))}"
              >Remove</button>
            </div>
          </div>
          <div class="history-item__edit" hidden>
            <label class="log-form__label" for="edit-start-${escapeHtml(cycle.startDate)}">Start date</label>
            <div class="log-form__row">
              <input
                type="date"
                id="edit-start-${escapeHtml(cycle.startDate)}"
                class="date-input"
                value="${escapeHtml(cycle.startDate)}"
                max="${todayISO()}"
              >
              <button type="button" class="btn btn-primary" data-save-edit="${escapeHtml(cycle.startDate)}">Save</button>
            </div>
          </div>
        </li>
      `;
    })
    .join('');

  return `
    <details class="panel">
      <summary>History (${cycles.length} logged)</summary>
      <p class="panel-hint">Change a start date if you logged the wrong day, or remove an entry entirely. Predictions recalculate instantly.</p>
      <ul class="history-list">${items}</ul>
    </details>

    <details class="panel">
      <summary>Data &amp; backup</summary>
      <p class="panel-hint">Everything lives on this device only. Keep a backup in case the phone is lost or storage is cleared.</p>
      <div class="data-tools">
        <button type="button" class="btn btn-secondary" id="btn-export">Export backup</button>
        <label class="btn btn-secondary data-tools__import" for="import-file">
          Import backup
          <input type="file" id="import-file" accept=".json,application/json" hidden>
        </label>
        <button type="button" class="link-danger data-tools__clear" id="btn-clear">Delete all data</button>
      </div>
    </details>
  `;
}

/**
 * Wire up handlers for the history and data panels.
 * @param {Element} root container the panels were rendered into
 * @param {() => void} onUpdate re-render callback
 */
export function bindHistoryPanels(root, onUpdate) {
  root.querySelectorAll('[data-edit-cycle]').forEach((button) => {
    button.addEventListener('click', () => {
      const startDate = button.getAttribute('data-edit-cycle');
      if (!startDate) return;
      const item = button.closest('.history-item');
      const editPanel = item?.querySelector('.history-item__edit');
      if (!editPanel) return;
      const isHidden = editPanel.hasAttribute('hidden');
      root.querySelectorAll('.history-item__edit').forEach((panel) => {
        panel.setAttribute('hidden', '');
      });
      if (isHidden) {
        editPanel.removeAttribute('hidden');
        editPanel.querySelector('input')?.focus();
      }
    });
  });

  root.querySelectorAll('[data-save-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const oldStart = button.getAttribute('data-save-edit');
      if (!oldStart) return;
      const item = button.closest('.history-item');
      const input = /** @type {HTMLInputElement | null} */ (
        item?.querySelector(`#edit-start-${CSS.escape(oldStart)}`)
      );
      const date = input?.value;
      const today = todayISO();
      if (!date || !isValidDateISO(date) || date > today) {
        showToast('Pick a valid date (not in the future)');
        return;
      }
      if (date === oldStart) {
        item?.querySelector('.history-item__edit')?.setAttribute('hidden', '');
        return;
      }
      if (!Storage.updateCycleStart(oldStart, date)) {
        showToast('Could not save — check the date and try again');
        return;
      }
      showToast('Start date updated');
      onUpdate();
    });
  });

  root.querySelectorAll('[data-delete-cycle]').forEach((button) => {
    button.addEventListener('click', () => {
      const startDate = button.getAttribute('data-delete-cycle');
      if (!startDate) return;
      if (!confirm(`Remove the entry from ${formatDisplayDate(startDate)}?`)) return;
      Storage.deleteCycle(startDate);
      showToast('Entry removed');
      onUpdate();
    });
  });

  root.querySelector('#btn-export')?.addEventListener('click', () => {
    const blob = new Blob([Storage.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cycle-companion-backup-${todayISO()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  });

  const importInput = root.querySelector('#import-file');
  importInput?.addEventListener('change', async () => {
    const file = /** @type {HTMLInputElement} */ (importInput).files?.[0];
    if (!file) return;
    const raw = await file.text();
    if (Storage.importData(raw)) {
      showToast('Backup restored');
      onUpdate();
    } else {
      showToast('Import failed — not a valid backup');
      /** @type {HTMLInputElement} */ (importInput).value = '';
    }
  });

  root.querySelector('#btn-clear')?.addEventListener('click', () => {
    if (!confirm('Delete all logged data? This cannot be undone.')) return;
    Storage.clearAll();
    showToast('All data deleted');
    onUpdate();
  });
}
