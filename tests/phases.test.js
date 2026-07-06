import { describe, expect, it } from 'vitest';
import { getPhaseExplanation, PHASE_EXPLANATIONS } from '../js/content/phases.js';

describe('phases', () => {
  it('explains every known phase in plain language', () => {
    for (const phase of Object.keys(PHASE_EXPLANATIONS)) {
      const explanation = getPhaseExplanation(phase);
      expect(explanation.label.length).toBeGreaterThan(0);
      expect(explanation.summary.length).toBeGreaterThan(20);
    }
  });

  it('falls back to luteal for unknown phases', () => {
    expect(getPhaseExplanation('unknown')).toEqual(PHASE_EXPLANATIONS.luteal);
  });

  it('describes follicular as a post-period rise in energy', () => {
    expect(getPhaseExplanation('follicular').summary).toMatch(/estrogen/i);
    expect(getPhaseExplanation('follicular').summary).toMatch(/energy/i);
  });
});
