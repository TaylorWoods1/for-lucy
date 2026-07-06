/** @typedef {'period' | 'follicular' | 'ovulation' | 'luteal' | 'pms'} Phase */

/**
 * Partner-friendly explanations for each cycle phase.
 * @type {Record<Phase, { label: string, summary: string }>}
 */
export const PHASE_EXPLANATIONS = {
  period: {
    label: 'Period',
    summary:
      'Her body is shedding the uterine lining. Bleeding, cramps, and lower energy are normal right now.',
  },
  follicular: {
    label: 'Follicular',
    summary:
      'Estrogen rises after her period as the body prepares an egg. Energy and mood often climb back — a fresh-start phase.',
  },
  ovulation: {
    label: 'Ovulation',
    summary:
      'An egg is released around mid-cycle. She may feel at her most energetic, confident, and social.',
  },
  luteal: {
    label: 'Luteal',
    summary:
      'Progesterone rises after ovulation, then tapers off. Energy may dip gradually and she might feel more inward.',
  },
  pms: {
    label: 'PMS',
    summary:
      'The days before her next period. Hormone drops can bring irritability, bloating, and sensitivity — hormonal, not personal.',
  },
};

/**
 * @param {string} phase
 * @returns {{ label: string, summary: string }}
 */
export function getPhaseExplanation(phase) {
  return PHASE_EXPLANATIONS[/** @type {Phase} */ (phase)] ?? PHASE_EXPLANATIONS.luteal;
}

/**
 * Collapsible reference list for all phases.
 * @returns {string}
 */
export function phaseGuideHtml() {
  const items = Object.values(PHASE_EXPLANATIONS)
    .map(
      (phase) => `
        <li class="phase-guide__item">
          <strong>${phase.label}</strong>
          <p>${phase.summary}</p>
        </li>
      `,
    )
    .join('');

  return `
    <details class="phase-guide">
      <summary>What do the phases mean?</summary>
      <ul class="phase-guide__list">${items}</ul>
    </details>
  `;
}
