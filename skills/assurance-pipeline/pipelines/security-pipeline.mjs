/**
 * Phase 1a deterministic detection pipeline:
 *
 *   s0-scope-seed       list the bounded scan scope and byte estimate (zero spend)
 *   s2-static-evidence  run stack-selected static adapters and normalize their evidence
 *   s3-prefilter        remove non-findings and explicitly low-confidence candidates
 *
 * SARIF and the human report are emitted from the last completed finding-bearing stage through the
 * spine's existing emitters and RunStore redaction boundary. No backend or LLM stage exists here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { emitReport } from '../lib/emit-report.mjs';
import { emitSarif } from '../lib/emit-sarif.mjs';
import { defineStage, runPipeline } from '../lib/stage-runner.mjs';
import { s2StaticEvidence, STATIC_FINDINGS_SCHEMA } from '../lib/stages/s2-static-evidence.mjs';

export const SECURITY_PIPELINE_ID = 'security-static-detection';
export const SECURITY_STAGE_NAMES = Object.freeze([
  's0-scope-seed',
  s2StaticEvidence.name,
  's3-prefilter',
]);
export const DEFAULT_SECURITY_CONFIG = Object.freeze({
  stack: 'ts',
  rulesets: Object.freeze(['p/default']),
});
export const SECURITY_TOOL = Object.freeze({
  name: 'assurance-pipeline-static',
  version: '1.0.0',
  informationUri: 'https://nuvoralink.internal/assurance-pipeline',
});

const EXCLUDED_SCOPE_DIRECTORIES = new Set(['.git', 'node_modules']);
const UNREACHED_SURFACES = Object.freeze([
  'runtime and dynamic-analysis behavior',
  'LLM verification, remediation, and execution-proven validation',
]);

function scopeFiles(target) {
  const resolvedTarget = path.resolve(target);
  if (!fs.existsSync(resolvedTarget)) throw new Error(`Scan target does not exist: ${resolvedTarget}`);
  const files = [];
  let estimatedBytes = 0;
  let skippedSymlinks = 0;

  const visit = (absolute, relative) => {
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) {
      skippedSymlinks += 1;
      return;
    }
    if (stat.isFile()) {
      files.push(relative || path.basename(absolute));
      estimatedBytes += stat.size;
      return;
    }
    if (!stat.isDirectory()) return;
    const entries = fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isDirectory() && EXCLUDED_SCOPE_DIRECTORIES.has(entry.name)) continue;
      visit(path.join(absolute, entry.name), relative ? path.join(relative, entry.name) : entry.name);
    }
  };

  visit(resolvedTarget, '');
  return {
    target: resolvedTarget,
    files: files.map((file) => file.split(path.sep).join(path.posix.sep)),
    file_count: files.length,
    estimated_bytes: estimatedBytes,
    skipped_symlinks: skippedSymlinks,
  };
}

export const s0ScopeSeed = defineStage({
  name: SECURITY_STAGE_NAMES[0],
  kind: 'det',
  run: async (ctx) => ({ ...scopeFiles(ctx.target), stack: ctx.config.stack }),
});

export const s3Prefilter = defineStage({
  name: SECURITY_STAGE_NAMES[2],
  kind: 'det',
  inputSchema: STATIC_FINDINGS_SCHEMA,
  outputSchema: STATIC_FINDINGS_SCHEMA,
  run: async (ctx, input) => ({
    staticFindings: input.staticFindings.filter(
      (finding) => finding.level !== 'none' && finding.confidence?.toLowerCase() !== 'low',
    ),
  }),
});

// NOTE: Phase 1a does NOT expose `--stop-after`. A partial run must model the FULL canonical stage
// list and pass a `stopAfter` bound to `runPipeline` (locked decision D-P1-3) so checkpoints are not
// discarded and re-spent once later phases add model stages — truncating the stage list here would be
// the exact F3 re-spend trap. That bound lands with the first phase where partial runs are useful.
export function buildSecurityStages() {
  return [s0ScopeSeed, s2StaticEvidence, s3Prefilter];
}

export function emitSecurityFindings({ store, findings, target }) {
  const sarif = emitSarif({ findings, tool: SECURITY_TOOL });
  const report = emitReport({
    findings: findings.map((finding) => ({
      ...finding,
      verdict: 'candidate',
      evidenceTier: 'WIRING-FACT',
    })),
    tool: SECURITY_TOOL,
    target,
    unreachedSurfaces: UNREACHED_SURFACES,
  });
  const sarifRef = store.writeEmitJson('assurance.sarif', sarif);
  const reportRef = store.writeEmitText('report.md', report);
  return {
    sarif_path: 'emit/assurance.sarif',
    report_path: 'emit/report.md',
    sarif_sha256: sarifRef.sha256,
    report_bytes: reportRef.bytes,
    finding_count: findings.length,
  };
}

export async function runSecurityPipeline({
  store,
  target,
  config = DEFAULT_SECURITY_CONFIG,
  adapters,
  now,
}) {
  const stages = buildSecurityStages();
  const result = await runPipeline({
    store,
    pipeline: SECURITY_PIPELINE_ID,
    config,
    target,
    stages,
    initialInput: { target },
    ctx: { adapters, config, store, target, runId: store.runId },
    now,
  });
  const findings = result.output?.staticFindings;
  return {
    ...result,
    emit: Array.isArray(findings) ? emitSecurityFindings({ store, findings, target }) : undefined,
  };
}
