import { CONFIG } from '../config.js';
import { $ } from './dom.js';

/**
 * Show a transient toast notification.
 * @param {string} message
 */
export function showToast(message) {
  const toast = $(CONFIG.ui.selectors.toast);
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), CONFIG.ui.toastDurationMs);
}
