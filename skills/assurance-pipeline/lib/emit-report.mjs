/**
 * Human report emitter for the assurance pipeline (Phase 0 spine component "e", human output).
 *
 * Produces a severity-ranked Markdown report. Every proposed fix carries a FIX-PROVEN /
 * FIX-PLAUSIBLE label (a proposed-but-unexecuted fix is a hypothesis until re-derived), and the
 * report closes with an honesty clause naming the surfaces this run did NOT reach — so a reader can
 * never mistake "not found here" for "does not exist". The report is a string; the caller persists it
 * through the redaction-on-write boundary.
 */

const LEVEL_RANK = { error: 0, warning: 1, note: 2, none: 3 };
const VALID_FIX_LABELS = new Set(['FIX-PROVEN', 'FIX-PLAUSIBLE']);

function rankOf(finding) {
  return LEVEL_RANK[finding.level] ?? LEVEL_RANK.none;
}

function renderFinding(finding, index) {
  const lines = [];
  lines.push(`### ${index}. ${finding.ruleId} — ${finding.ruleName ?? finding.ruleId} (${finding.level})`);
  lines.push('');
  lines.push(`- Location: \`${finding.uri}:${finding.startLine ?? 1}\``);
  lines.push(`- Verdict: ${finding.verdict ?? 'candidate'}`);
  lines.push(`- Evidence tier: ${finding.evidenceTier ?? 'RELAYED'}`);
  lines.push(`- Message: ${finding.message}`);
  if (finding.snippet) lines.push(`- Snippet: \`${finding.snippet}\``);
  if (finding.fixSummary) {
    const label = VALID_FIX_LABELS.has(finding.fixLabel) ? finding.fixLabel : 'FIX-PLAUSIBLE';
    lines.push(`- Proposed fix (${label}): ${finding.fixSummary}`);
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * @param {object} args
 * @param {Array}  args.findings
 * @param {object} args.tool                { name, version? }
 * @param {string} args.target
 * @param {string[]} args.unreachedSurfaces surfaces this run did not analyze (honesty clause)
 * @returns {string} Markdown
 */
export function emitReport({ findings = [], tool, target, unreachedSurfaces = [] }) {
  const ranked = [...findings].sort((a, b) => rankOf(a) - rankOf(b));
  const counts = ranked.reduce((acc, finding) => {
    acc[finding.level] = (acc[finding.level] ?? 0) + 1;
    return acc;
  }, {});

  const out = [];
  out.push(`# Assurance report — ${tool?.name ?? 'assurance-pipeline'}`);
  out.push('');
  out.push(`- Target: \`${target}\``);
  out.push(`- Findings: ${ranked.length} (${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'})`);
  out.push('');
  out.push('## Findings');
  out.push('');
  if (ranked.length === 0) {
    out.push('No findings in the analyzed surfaces.');
    out.push('');
  } else {
    ranked.forEach((finding, index) => out.push(renderFinding(finding, index + 1)));
  }
  out.push('## Coverage');
  out.push('');
  if (unreachedSurfaces.length === 0) {
    out.push('This run reports on the surfaces it analyzed; no unreached surfaces were declared.');
  } else {
    out.push('Not reached by this run (absence here is not proof of absence):');
    out.push('');
    for (const surface of unreachedSurfaces) out.push(`- ${surface}`);
  }
  out.push('');
  return out.join('\n');
}
