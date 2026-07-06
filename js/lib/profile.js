import { CONFIG } from '../config.js';
import Storage from './storage.js';

/**
 * @returns {string}
 */
export function getPartnerName() {
  const name = Storage.getSettings().partnerName?.trim();
  return name || CONFIG.app.defaultName;
}

/**
 * @returns {boolean}
 */
export function isPartnerNameSet() {
  return Boolean(Storage.getSettings().partnerName?.trim());
}

/**
 * @param {string} [name]
 * @returns {string}
 */
export function getAppTitle(name = getPartnerName()) {
  if (isPartnerNameSet()) return `For ${name}`;
  return CONFIG.app.title;
}

/**
 * @param {string} [name]
 * @returns {string}
 */
export function getAppDescription(name = getPartnerName()) {
  if (isPartnerNameSet()) {
    return `Track ${name}'s cycle phases and get supportive partner tips.`;
  }
  return CONFIG.app.description;
}

/**
 * @param {string} raw
 * @returns {string | null} Sanitized name, or null when invalid.
 */
export function normalizePartnerName(raw) {
  if (typeof raw !== 'string') return null;
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 40) return null;
  return name;
}

/**
 * Sync the document shell with the stored partner name.
 */
export function applyBranding() {
  const title = getAppTitle();
  const description = getAppDescription();

  document.title = title;

  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute('content', description);

  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) appleTitleMeta.setAttribute('content', title);

  const heading = document.querySelector('header h1');
  if (heading) heading.textContent = title;
}
