import Storage from './lib/storage.js';
import { getCycleState } from './lib/cycle.js';
import { canUseApp } from './lib/platform.js';
import { renderOnboarding } from './ui/onboarding.js';
import { renderDashboard } from './ui/dashboard.js';
import { initInstallPrompt } from './ui/install-prompt.js';

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
  initInstallPrompt();
  if (canUseApp()) {
    render();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { type: 'module' }).catch(() => {});
}
