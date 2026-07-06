import { beforeEach, describe, expect, it, vi } from 'vitest';

const memoryStore = {};

vi.stubGlobal('localStorage', {
  getItem: (key) => memoryStore[key] ?? null,
  setItem: (key, value) => {
    memoryStore[key] = value;
  },
  removeItem: (key) => {
    delete memoryStore[key];
  },
});

const { default: Storage } = await import('../js/lib/storage.js');
const {
  applyBranding,
  getAppDescription,
  getAppTitle,
  getPartnerName,
  isPartnerNameSet,
  normalizePartnerName,
} = await import('../js/lib/profile.js');

describe('profile', () => {
  beforeEach(() => {
    Object.keys(memoryStore).forEach((key) => delete memoryStore[key]);
  });

  it('falls back to generic branding before a name is saved', () => {
    expect(getPartnerName()).toBe('her');
    expect(isPartnerNameSet()).toBe(false);
    expect(getAppTitle()).toBe('Cycle Companion');
    expect(getAppDescription()).toBe('Track cycle phases and get supportive partner tips.');
  });

  it('uses the saved partner name in branding helpers', () => {
    Storage.saveSettings({ partnerName: 'Lucy' });
    expect(getPartnerName()).toBe('Lucy');
    expect(isPartnerNameSet()).toBe(true);
    expect(getAppTitle()).toBe('For Lucy');
    expect(getAppDescription()).toBe("Track Lucy's cycle phases and get supportive partner tips.");
  });

  it('normalizes partner names', () => {
    expect(normalizePartnerName('  Lucy  ')).toBe('Lucy');
    expect(normalizePartnerName('')).toBeNull();
    expect(normalizePartnerName('a'.repeat(41))).toBeNull();
  });

  it('updates the document shell from saved settings', () => {
    const descriptionMeta = { setAttribute: vi.fn() };
    const appleTitleMeta = { setAttribute: vi.fn() };
    const heading = { textContent: '' };

    vi.stubGlobal('document', {
      title: '',
      querySelector: (selector) => {
        if (selector === 'meta[name="description"]') return descriptionMeta;
        if (selector === 'meta[name="apple-mobile-web-app-title"]') return appleTitleMeta;
        if (selector === 'header h1') return heading;
        return null;
      },
    });

    Storage.saveSettings({ partnerName: 'Sarah' });
    applyBranding();

    expect(document.title).toBe('For Sarah');
    expect(descriptionMeta.setAttribute).toHaveBeenCalledWith(
      'content',
      "Track Sarah's cycle phases and get supportive partner tips.",
    );
    expect(appleTitleMeta.setAttribute).toHaveBeenCalledWith('content', 'For Sarah');
    expect(heading.textContent).toBe('For Sarah');
  });
});
