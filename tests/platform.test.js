import { beforeEach, describe, expect, it, vi } from 'vitest';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function stubBrowser({ standalone = false, userAgent = IPHONE_UA } = {}) {
  const navigator = { standalone: standalone ? true : undefined, userAgent };
  vi.stubGlobal('navigator', navigator);
  vi.stubGlobal('window', {
    navigator,
    matchMedia: (query) => ({
      matches:
        (query === '(display-mode: standalone)' && standalone) ||
        (query === '(display-mode: browser)' && !standalone),
      addEventListener: vi.fn(),
    }),
    location: { reload: vi.fn() },
    addEventListener: vi.fn(),
  });
}

describe('platform', () => {
  beforeEach(() => {
    vi.resetModules();
    stubBrowser();
  });

  it('detects non-standalone browser mode', async () => {
    const { isStandalone } = await import('../js/lib/platform.js');
    expect(isStandalone()).toBe(false);
  });

  it('detects iOS browser tabs via display-mode: browser', async () => {
    stubBrowser({ standalone: false });
    const { isStandalone, canUseApp } = await import('../js/lib/platform.js');
    expect(isStandalone()).toBe(false);
    expect(canUseApp()).toBe(false);
  });

  it('detects iOS home screen via navigator.standalone', async () => {
    stubBrowser({ standalone: true });
    vi.resetModules();
    stubBrowser({ standalone: true });
    const navigator = { standalone: true, userAgent: IPHONE_UA };
    vi.stubGlobal('navigator', navigator);
    vi.stubGlobal('window', {
      navigator,
      matchMedia: (query) => ({
        matches:
          query === '(display-mode: standalone)' || (query === '(display-mode: browser)' && false),
        addEventListener: vi.fn(),
      }),
      location: { reload: vi.fn() },
      addEventListener: vi.fn(),
    });
    vi.resetModules();
    const { isStandalone, canUseApp } = await import('../js/lib/platform.js');
    expect(isStandalone()).toBe(true);
    expect(canUseApp()).toBe(true);
  });

  it('detects standalone display mode', async () => {
    stubBrowser({ standalone: true });
    const { isStandalone } = await import('../js/lib/platform.js');
    expect(isStandalone()).toBe(true);
  });

  it('detects mobile user agents', async () => {
    const { isMobile, getPlatform } = await import('../js/lib/platform.js');
    expect(isMobile()).toBe(true);
    expect(getPlatform()).toBe('ios');
  });

  it('detects desktop user agents', async () => {
    stubBrowser({ userAgent: DESKTOP_UA });
    vi.resetModules();
    const { isMobile, getPlatform } = await import('../js/lib/platform.js');
    expect(isMobile()).toBe(false);
    expect(getPlatform()).toBe('other');
  });

  it('blocks desktop browsers even when installed as a PWA', async () => {
    stubBrowser({ standalone: true, userAgent: DESKTOP_UA });
    vi.resetModules();
    const { canUseApp, getAccessBlockReason } = await import('../js/lib/platform.js');
    expect(getAccessBlockReason()).toBe('mobile');
    expect(canUseApp()).toBe(false);
  });

  it('blocks mobile browser usage when install is required', async () => {
    const { canUseApp, getAccessBlockReason } = await import('../js/lib/platform.js');
    expect(getAccessBlockReason()).toBe('install');
    expect(canUseApp()).toBe(false);
  });

  it('allows usage on mobile when installed as a PWA', async () => {
    stubBrowser({ standalone: true });
    vi.resetModules();
    const { canUseApp, getAccessBlockReason } = await import('../js/lib/platform.js');
    expect(getAccessBlockReason()).toBe('none');
    expect(canUseApp()).toBe(true);
  });

  it('provides platform-specific install steps', async () => {
    const { getInstallSteps } = await import('../js/lib/platform.js');
    expect(getInstallSteps('ios')[0].title).toBe('Tap Share');
    expect(getInstallSteps('android')[1].title).toBe('Install the app');
    expect(getInstallSteps('other')).toHaveLength(2);
    expect(getInstallSteps('ios')[2].body).toContain('Cycle Companion');
  });

  it('shows install gate in browser when install is required', async () => {
    const { shouldShowInstallPrompt } = await import('../js/lib/platform.js');
    expect(shouldShowInstallPrompt(false)).toBe(true);
    expect(shouldShowInstallPrompt(true)).toBe(true);
  });

  it('hides install gate when running as installed PWA on mobile', async () => {
    stubBrowser({ standalone: true });
    vi.resetModules();
    const { shouldShowInstallPrompt } = await import('../js/lib/platform.js');
    expect(shouldShowInstallPrompt(false)).toBe(false);
  });
});
