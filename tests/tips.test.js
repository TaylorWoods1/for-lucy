import { describe, expect, it } from 'vitest';
import { getTipTemplates, getTipsForPhase, TIP_TEMPLATES } from '../js/content/tips.js';

describe('tips', () => {
  it('interpolates the partner name into tip copy', () => {
    const tips = getTipsForPhase('period', 1, 'Lucy');
    expect(tips[0]).toContain("Lucy's favourite snack");
  });

  it('keys tip rotation to the cycle day when provided', () => {
    const templates = getTipTemplates('Lucy');
    expect(getTipsForPhase('pms', 1, 'Lucy')).toEqual(templates.pms[0]);
    expect(getTipsForPhase('pms', 2, 'Lucy')).toEqual(templates.pms[1]);
    expect(getTipsForPhase('pms', 3, 'Lucy')).toEqual(templates.pms[0]);
  });

  it('falls back to calendar rotation without a cycle day', () => {
    const templates = getTipTemplates('Lucy');
    const tips = getTipsForPhase('period', undefined, 'Lucy');
    expect(templates.period).toContainEqual(tips);
  });

  it('falls back to luteal tips for unknown phases', () => {
    const templates = getTipTemplates('Lucy');
    expect(templates.luteal).toContainEqual(getTipsForPhase('unknown', 1, 'Lucy'));
  });

  it('keeps templates parameterized until a name is provided', () => {
    expect(TIP_TEMPLATES.period[0][0]).toContain('{{name}}');
  });
});
