/**
 * Voting-panel helper for the assurance pipeline (Phase 0 spine component "b").
 *
 * Invoke N diverse lenses over one subject, tally their verdicts, and require at least `threshold`
 * agreeing votes for a decisive verdict; otherwise the subject is `needs_review` (the pipeline never
 * fabricates a verdict it cannot support). At N === 1 there is no panel to vote, so a lone lens is
 * NOT trusted as a vote-of-one — the deterministic fallback (a grounding/prefilter check) decides
 * instead (plan stage S5: "det-prefilter fallback at N=1"). Lenses are async `(subject) => vote`
 * where `vote` is `{ verdict, ... }`; determinism of the lenses makes the panel reproducible.
 */

export const PANEL_METHODS = Object.freeze(['vote', 'deterministic-fallback']);

export async function runVotingPanel({ lenses, threshold, deterministicFallback, subject }) {
  if (!Array.isArray(lenses) || lenses.length === 0) {
    throw new Error('voting panel requires at least one lens');
  }

  if (lenses.length === 1) {
    if (typeof deterministicFallback !== 'function') {
      throw new Error('a single-lens panel requires a deterministic fallback (no vote-of-one)');
    }
    const vote = await deterministicFallback(subject);
    return {
      verdict: vote.verdict,
      method: 'deterministic-fallback',
      lens_count: 1,
      threshold,
      agreeing: 1,
      votes: [vote],
    };
  }

  if (!Number.isInteger(threshold) || threshold < 1 || threshold > lenses.length) {
    throw new Error(`voting threshold must be an integer in 1..${lenses.length}, got ${threshold}`);
  }

  const votes = await Promise.all(lenses.map((lens) => lens(subject)));
  const tally = new Map();
  for (const vote of votes) tally.set(vote.verdict, (tally.get(vote.verdict) ?? 0) + 1);

  let leadingVerdict;
  let leadingCount = -1;
  let tied = false;
  for (const [verdict, count] of tally) {
    if (count > leadingCount) {
      leadingVerdict = verdict;
      leadingCount = count;
      tied = false;
    } else if (count === leadingCount) {
      tied = true;
    }
  }

  const decisive = leadingCount >= threshold && !tied;
  return {
    verdict: decisive ? leadingVerdict : 'needs_review',
    method: 'vote',
    lens_count: lenses.length,
    threshold,
    agreeing: leadingCount,
    tally: Object.fromEntries(tally),
    votes,
  };
}
