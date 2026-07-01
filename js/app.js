import Storage from './lib/storage.js';
import { getCycleState } from './lib/cycle.js';
import { renderOnboarding } from './ui/onboarding.js';
import { renderDashboard } from './ui/dashboard.js';

/** Re-render the current view from stored data. */
function render() {
  const cycles = Storage.getCycles();
  const settings = Storage.getSettings();

  if (!cycles.length) {
    renderOnboarding(render);
    return;
  }

  const state = getCycleState(cycles, settings);
  renderDashboard(state, cycles, settings, render);
}

document.addEventListener('DOMContentLoaded', () => {
  render();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { type: 'module' }).catch(() => {});
}
