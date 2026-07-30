/**
 * Weighted verdict scoring for review and verify roles.
 *
 * This module is the ONLY place the verdict algebra lives. Per-role criteria and
 * weights are data in the agent-role registries; the prose contract agents read is
 * `global/claude/rules/verdict-rubric.md`. Nothing else may re-implement the maths.
 *
 * The load-bearing property: an unevaluated criterion is weight-neutral — it leaves
 * the denominator rather than scoring zero — so a lens can never inflate its score by
 * skipping hard criteria, and can never be failed for honestly declaring a gap. Instead
 * the coverage floor and the critical-criterion rule convert insufficient evidence into
 * UNVERIFIABLE, which no amount of passing elsewhere can waive.
 */

/** Status a lens may report per criterion. */
export const STATUSES = Object.freeze(['pass', 'partial', 'fail', 'skip']);

/** Score contribution per status. `skip` is absent: it leaves the denominator entirely. */
export const STATUS_MULTIPLIER = Object.freeze({ pass: 1, partial: 0.5, fail: 0 });

/** Normalized score at or above which a fully-covered review may ACCEPT. */
export const ACCEPT_THRESHOLD = 0.9;

export const VERDICTS = Object.freeze(['ACCEPT', 'REJECT', 'UNVERIFIABLE']);

/**
 * Validate a rubric in isolation: ids unique, weights sum to 100, at least one critical.
 * @returns {string[]} problems, empty when valid.
 */
export function validateRubric(rubric, label = 'rubric') {
  const problems = [];
  if (!rubric || typeof rubric !== 'object' || !Array.isArray(rubric.criteria)) {
    return [`${label} must be an object with a criteria array`];
  }
  const ids = new Set();
  let total = 0;
  for (const criterion of rubric.criteria) {
    if (ids.has(criterion.id)) problems.push(`${label} has duplicate criterion id: ${criterion.id}`);
    ids.add(criterion.id);
    total += criterion.weight;
  }
  // Float tolerance: authored weights like 24.67 cannot sum exactly in binary.
  if (Math.abs(total - 100) > 0.01) {
    problems.push(`${label} weights must sum to 100, got ${total.toFixed(2)}`);
  }
  if (!rubric.criteria.some((criterion) => criterion.critical === true)) {
    problems.push(`${label} must mark at least one criterion critical`);
  }
  if (typeof rubric.coverage_floor !== 'number' || rubric.coverage_floor <= 0 || rubric.coverage_floor > 1) {
    problems.push(`${label} coverage_floor must be a fraction in (0, 1]`);
  }
  return problems;
}

/**
 * Score a lens report against its registered rubric.
 *
 * @param {{coverage_floor: number, criteria: Array<{id: string, weight: number, critical: boolean}>}} rubric
 * @param {Record<string, 'pass'|'partial'|'fail'|'skip'>} statuses reported by the lens
 * @returns {{verdict: string, score: number|null, coverage: number, unevaluated: string[], reasons: string[]}}
 */
export function scoreVerdict(rubric, statuses) {
  const problems = validateRubric(rubric);
  if (problems.length > 0) throw new Error(`Invalid rubric:\n${problems.join('\n')}`);
  if (!statuses || typeof statuses !== 'object') throw new TypeError('statuses must be an object');

  const reported = new Map(Object.entries(statuses));
  for (const [id, status] of reported) {
    if (!STATUSES.includes(status)) throw new Error(`Unknown status for ${id}: ${String(status)}`);
  }

  const totalWeight = rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  let activeWeight = 0;
  let earned = 0;
  const unevaluated = [];
  const reasons = [];
  const criticalUnevaluated = [];
  const criticalShortfall = [];

  for (const criterion of rubric.criteria) {
    // A criterion the lens never mentioned is unevaluated, exactly like an explicit skip.
    // Silence must never read as a pass.
    const status = reported.get(criterion.id) ?? 'skip';
    if (status === 'skip') {
      unevaluated.push(criterion.id);
      if (criterion.critical) criticalUnevaluated.push(criterion.id);
      continue;
    }
    activeWeight += criterion.weight;
    earned += criterion.weight * STATUS_MULTIPLIER[status];
    if (criterion.critical && status !== 'pass') criticalShortfall.push(`${criterion.id}=${status}`);
  }

  const coverage = totalWeight === 0 ? 0 : activeWeight / totalWeight;

  if (criticalUnevaluated.length > 0) {
    reasons.push(`critical criteria unevaluated: ${criticalUnevaluated.join(', ')}`);
    return { verdict: 'UNVERIFIABLE', score: null, coverage, unevaluated, reasons };
  }
  if (coverage < rubric.coverage_floor) {
    reasons.push(
      `coverage ${(coverage * 100).toFixed(1)}% below floor ${(rubric.coverage_floor * 100).toFixed(1)}%`,
    );
    return { verdict: 'UNVERIFIABLE', score: null, coverage, unevaluated, reasons };
  }

  const score = activeWeight === 0 ? 0 : Math.min(earned / activeWeight, 1);

  if (criticalShortfall.length > 0) {
    reasons.push(`critical criteria not fully met: ${criticalShortfall.join(', ')}`);
    return { verdict: 'REJECT', score, coverage, unevaluated, reasons };
  }
  if (score < ACCEPT_THRESHOLD) {
    reasons.push(`score ${score.toFixed(3)} below accept threshold ${ACCEPT_THRESHOLD}`);
    return { verdict: 'REJECT', score, coverage, unevaluated, reasons };
  }
  return { verdict: 'ACCEPT', score, coverage, unevaluated, reasons };
}

/**
 * Roles whose mode obliges them to carry a rubric. Implement/orchestrate roles report
 * evidence, not verdicts, so they are exempt by mode rather than by a hand-kept list.
 */
export const RUBRIC_REQUIRED_MODES = Object.freeze(['review_read_only', 'verify_runtime']);

export function rubricIsRequired(role) {
  return RUBRIC_REQUIRED_MODES.includes(role?.mode);
}
