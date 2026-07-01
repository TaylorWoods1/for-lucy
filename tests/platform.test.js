import { beforeEach, describe, expect, it, vi } from 'vitest';

function stubBrowser({ standalone = false, userAgent = 'Mozilla/5.0 (iPhone)' } = {}) {
  const navigator = { standalone: undefined, userAgent };
  vi.stubGlobal('navigator', navigator);
  vi.stubGlobal('window', {
    navigator,
    matchMedia: (query) => ({
      matches:
        (query === '(display-mode: standalone)' && standalone) ||
        (query === '(display-mode: fullscreen)' && standalone),
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

  it('detects standalone display mode', async () => {
    stubBrowser({ standalone: true });
    const { isStandalone } = await import('../js/lib/platform.js');
    expect(isStandalone()).toBe(true);
  });

  it('blocks browser usage when install is required', async () => {
    const { canUseApp } = await import('../js/lib/platform.js');
    expect(canUseApp()).toBe(false);
  });

  it('allows usage when installed as a PWA', async () => {
    stubBrowser({ standalone: true });
    vi.resetModules();
    const { canUseApp } = await import('../js/lib/platform.js');
    expect(canUseApp()).toBe(true);
  });

  it('provides platform-specific install steps', async () => {
    const { getInstallSteps, INSTALL_STEPS } = await import('../js/lib/platform.js');
    expect(getInstallSteps('ios')[0].title).toBe('Tap Share');
    expect(getInstallSteps('android')[1].title).toBe('Install the app');
    expect(getInstallSteps('other')).toHaveLength(INSTALL_STEPS.other.length);
  });

  it('shows install gate in browser when install is required', async () => {
    const { shouldShowInstallPrompt } = await import('../js/lib/platform.js');
    expect(shouldShowInstallPrompt(false)).toBe(true);
    expect(shouldShowInstallPrompt(true)).toBe(true);
  });

  it('hides install gate when running as installed PWA', async () => {
    stubBrowser({ standalone: true });
    vi.resetModules();
    const { shouldShowInstallPrompt } = await import('../js/lib/platform.js');
    expect(shouldShowInstallPrompt(false)).toBe(false);
  });
});
