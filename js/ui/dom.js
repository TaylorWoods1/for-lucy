/**
 * DOM helpers and XSS-safe HTML utilities.
 */

/**
 * @param {string} selector
 * @returns {Element | null}
 */
export function $(selector) {
  return document.querySelector(selector);
}

/**
 * Escape text for safe HTML insertion.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Build an HTML list from escaped string items.
 * @param {string[]} items
 * @returns {string}
 */
export function htmlList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}
