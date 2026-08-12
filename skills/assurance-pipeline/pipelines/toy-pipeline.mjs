/**
 * Toy 3-stage pipeline that PROVES the assurance spine (Phase 0 DoD). It carries no real security
 * lenses — it exists only to exercise the runner, run-store, backend, voting panel, redaction, and
 * emitters end-to-end, deterministically, with the mock backend.
 *
 *   produce  [det]  plant a small set of candidate findings, one of which embeds a secret
 *   verify   [llm]  run the voting panel (N mock lenses) over each candidate -> verdicts
 *   emit     [det]  write a SARIF 2.1.0 log + a human report (both redacted on write)
 *
 * The planted PAN / API key / SSN are ASSEMBLED AT RUNTIME from fragments so the committed source
 * carries no secret-shaped literal (control:validate's secret scanner and gitleaks would flag one).
 * They flow produce -> verify -> emit in memory (unredacted) and are masked only when the emit
 * stage persists the SARIF and report through the redaction-on-write boundary.
 */
import { defineStage } from '../lib/stage-runner.mjs';
import { runVotingPanel } from '../lib/voting-panel.mjs';
import { emitSarif } from '../lib/emit-sarif.mjs';
import { emitReport } from '../lib/emit-report.mjs';
import { schemaPath } from '../lib/paths.mjs';
import { DEFAULT_TOKENS_PER_CALL, DEFAULT_USD_PER_MILLION_TOKENS } from '../lib/estimate.mjs';

export const TOY_PIPELINE_ID = 'toy-spine-proof';
export const TOY_STAGE_NAMES = Object.freeze(['produce', 'verify', 'emit']);
export const TOY_TOOL = Object.freeze({
  name: 'assurance-pipeline-toy',
  version: '0.0.0',
  informationUri: 'https://nuvoralink.internal/assurance-pipeline',
});
export const TOY_UNREACHED_SURFACES = Object.freeze([
  'real static-analysis lenses (Semgrep/CodeQL/osv/gitleaks) — Phase 1',
  'remediation + execution-proven validation — Phase 1',
]);
export const TOY_DEFAULT_CONFIG = Object.freeze({
  lenses: ['correctness', 'exploitability', 'reproduces'],
  vote_threshold: 2,
  estimate: { tokens_per_call: DEFAULT_TOKENS_PER_CALL, usd_per_million_tokens: DEFAULT_USD_PER_MILLION_TOKENS },
});

/**
 * Assemble the planted secrets at runtime. Kept out of committed literals on purpose — see the file
 * header and skills/assurance-pipeline/lib/redaction.mjs. Returns null when planting is disabled.
 */
function plantedSecrets(enabled) {
  if (!enabled) return null;
  const pan = ['4111', '1111', '1111', '1111'].join(''); // Visa test PAN, Luhn-valid, IIN 4
  const ssn = ['078', '05', '1120'].join('-'); // well-known test SSN
  const apiKey = ['sk', '-', 'toy', Buffer.from('assurance').toString('hex'), '000000'].join('');
  return { pan, ssn, apiKey };
}

function toSarifFinding(finding) {
  return {
    ruleId: finding.ruleId,
    ruleName: finding.ruleName,
    ruleDescription: finding.ruleDescription,
    level: finding.level,
    message: finding.message,
    uri: finding.uri,
    startLine: finding.startLine,
    snippet: finding.evidence,
  };
}

function toReportFinding(finding) {
  return {
    ruleId: finding.ruleId,
    ruleName: finding.ruleName,
    level: finding.level,
    uri: finding.uri,
    startLine: finding.startLine,
    message: finding.message,
    snippet: finding.evidence,
    verdict: finding.verdict,
    evidenceTier: finding.evidenceTier,
    fixSummary: finding.fixSummary,
    fixLabel: finding.fixLabel,
  };
}

export function buildToyStages() {
  const produce = defineStage({
    name: 'produce',
    kind: 'det',
    inputSchema: schemaPath('toy-scope.v1.schema.json'),
    outputSchema: schemaPath('toy-findings.v1.schema.json'),
    run: async (ctx, input) => {
      const secrets = plantedSecrets(input.plant_secret !== false);
      const candidates = [
        {
          id: 'F1',
          ruleId: 'TOY-SECRET-001',
          ruleName: 'HardcodedSecret',
          ruleDescription: 'A credential literal appears in source and must be masked in every artifact.',
          level: 'error',
          uri: 'src/config/app-settings.js',
          startLine: 12,
          message: secrets
            ? `Hardcoded credentials found: card ${secrets.pan}, api key ${secrets.apiKey}, ssn ${secrets.ssn}.`
            : 'Hardcoded credentials placeholder.',
          evidence: secrets
            ? `const API_KEY = "${secrets.apiKey}"; // card=${secrets.pan} ssn=${secrets.ssn}`
            : 'const API_KEY = "<none>";',
          fixSummary: 'Load the credential from an environment variable and rotate the exposed value.',
          fixLabel: 'FIX-PLAUSIBLE',
        },
        {
          id: 'F2',
          ruleId: 'TOY-QUALITY-002',
          ruleName: 'UnreachableBranch',
          ruleDescription: 'A branch that can never execute.',
          level: 'warning',
          uri: 'src/util/parse.js',
          startLine: 44,
          message: 'Unreachable branch: the guarded block can never run.',
          evidence: 'if (false) { neverRuns(); }',
          fixSummary: 'Delete the dead branch.',
          fixLabel: 'FIX-PROVEN',
        },
        {
          id: 'F3',
          ruleId: 'TOY-NOISE-003',
          ruleName: 'LowSignalHit',
          ruleDescription: 'A low-signal candidate with no supporting evidence.',
          level: 'note',
          uri: 'src/util/log.js',
          startLine: 3,
          message: 'A variable named token is logged; no evidence it is sensitive.',
        },
      ];
      return { candidates };
    },
  });

  const verify = defineStage({
    name: 'verify',
    kind: 'llm',
    inputSchema: schemaPath('toy-findings.v1.schema.json'),
    outputSchema: schemaPath('toy-verdicts.v1.schema.json'),
    run: async (ctx, input) => {
      const { backend, config } = ctx;
      const lensRoles = config.lenses ?? TOY_DEFAULT_CONFIG.lenses;
      const threshold = config.vote_threshold ?? TOY_DEFAULT_CONFIG.vote_threshold;
      const findings = [];
      for (const candidate of input.candidates) {
        const lenses = lensRoles.map((role, index) => async (subject) => {
          const vote = await backend.invoke({ role, input: subject, seed: index });
          return { role, verdict: vote.grounded ? 'confirmed' : 'rejected', confidence: vote.confidence };
        });
        // At N===1 the panel uses this deterministic prefilter instead of trusting a vote-of-one.
        const deterministicFallback = (subject) => ({
          role: 'det-prefilter',
          verdict: subject && typeof subject === 'object' && 'evidence' in subject ? 'confirmed' : 'rejected',
        });
        const panel = await runVotingPanel({ lenses, threshold, deterministicFallback, subject: candidate });
        findings.push({
          ...candidate,
          verdict: panel.verdict,
          evidenceTier: panel.verdict === 'confirmed' ? 'WIRING-FACT' : 'RELAYED',
          panel: {
            method: panel.method,
            agreeing: panel.agreeing,
            lens_count: panel.lens_count,
            threshold: panel.threshold,
          },
        });
      }
      return { findings };
    },
  });

  const emit = defineStage({
    name: 'emit',
    kind: 'det',
    inputSchema: schemaPath('toy-verdicts.v1.schema.json'),
    outputSchema: schemaPath('toy-emit.v1.schema.json'),
    run: async (ctx, input) => emitFromVerdicts({ store: ctx.store, verdicts: input, target: ctx.target }),
  });

  return [produce, verify, emit];
}

/**
 * Build the SARIF + report from verified findings and persist both (redacted on write). Shared by the
 * emit STAGE and by the CLI `report` command, which re-emits from the persisted verify artifact with
 * no re-run and no backend calls — one producer of the emit result, never two.
 */
export function emitFromVerdicts({ store, verdicts, target }) {
  const confirmed = verdicts.findings.filter((finding) => finding.verdict === 'confirmed');
  const sarif = emitSarif({ findings: confirmed.map(toSarifFinding), tool: TOY_TOOL });
  const report = emitReport({
    findings: confirmed.map(toReportFinding),
    tool: TOY_TOOL,
    target,
    unreachedSurfaces: TOY_UNREACHED_SURFACES,
  });
  const sarifRef = store.writeEmitJson('assurance.sarif', sarif);
  const reportRef = store.writeEmitText('report.md', report);
  return {
    sarif_path: 'emit/assurance.sarif',
    report_path: 'emit/report.md',
    sarif_sha256: sarifRef.sha256,
    report_bytes: reportRef.bytes,
    confirmed_count: confirmed.length,
    total_count: verdicts.findings.length,
  };
}
