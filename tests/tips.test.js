import { describe, expect, it } from 'vitest';
import { getTipsForPhase, TIPS } from '../js/content/tips.js';

describe('tips', () => {
  it('keys tip rotation to the cycle day when provided', () => {
    expect(getTipsForPhase('pms', 1)).toBe(TIPS.pms[0]);
    expect(getTipsForPhase('pms', 2)).toBe(TIPS.pms[1]);
    expect(getTipsForPhase('pms', 3)).toBe(TIPS.pms[0]);
  });

  it('falls back to calendar rotation without a cycle day', () => {
    const tips = getTipsForPhase('period');
    expect(TIPS.period).toContainEqual(tips);
  });

  it('falls back to luteal tips for unknown phases', () => {
    expect(TIPS.luteal).toContainEqual(getTipsForPhase('unknown', 1));
  });
});
