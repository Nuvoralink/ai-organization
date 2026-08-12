/**
 * Proves: Assurance Pipeline Phase 1a S2 static evidence normalizes Semgrep OSS SARIF, preserves
 *         D7 snippet-invariant identity, enforces explicit telemetry-off argv, selects adapters by
 *         stack, validates every StaticFinding, and runs the deterministic S0 -> S2 -> S3 pipeline.
 * Test type: unit + integration + killer-mutation
 * Surface: static SARIF normalizer, Semgrep argv, adapter registry, S2 stage, security pipeline/CLI.
 * Authority: static-finding.v1.schema.json, Semgrep OSS argv policy, and stage-runner checkpoints.
 * Given messy inline SARIF or injected offline adapters, normalized and emitted evidence is stable,
 * schema-valid, and filtered only by structural level/confidence; the named mutations turn red.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateJsonAgainstSchema } from '../../../core/schema/validate-json-schema.mjs';
import { runSecurityScan } from '../cli.mjs';
import { buildSemgrepArgv, semgrepAdapter } from '../lib/adapters/static/semgrep.mjs';
import { normalizeSarif } from '../lib/adapters/static/normalize.mjs';
import { getAdaptersForStack, registerAdapter } from '../lib/adapters/static/registry.mjs';
import {
  s2StaticEvidence,
  STATIC_FINDINGS_SCHEMA,
  STATIC_FINDING_SCHEMA,
} from '../lib/stages/s2-static-evidence.mjs';
import { SECURITY_STAGE_NAMES } from '../pipelines/security-pipeline.mjs';

const MESSY_SEMGREP_SARIF = String.raw`{
  "version": "2.1.0",
  "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
  "runs": [{
    "tool": {
      "driver": {
        "name": "Semgrep OSS",
        "rules": [{
          "id": "javascript.lang.security.audit.detect-eval-with-expression",
          "name": "detect-eval-with-expression",
          "shortDescription": { "text": "Detected eval with a non-literal argument." },
          "fullDescription": { "text": "Eval on dynamic input can execute attacker-controlled JavaScript." },
          "properties": { "confidence": "HIGH", "cwe": ["CWE-95", "CWE-94"] }
        }]
      }
    },
    "results": [{
      "ruleId": "javascript.lang.security.audit.detect-eval-with-expression",
      "ruleIndex": 0,
      "level": "error",
      "message": { "text": "Dynamic input reaches eval()." },
      "locations": [{
        "physicalLocation": {
          "artifactLocation": { "uri": "src/app.js", "uriBaseId": "%SRCROOT%" },
          "region": {
            "startLine": 42,
            "startColumn": 7,
            "endLine": 42,
            "endColumn": 24,
            "snippet": { "text": "eval(userControlledValue);" }
          }
        },
        "logicalLocations": [{ "name": "handler" }]
      }],
      "codeFlows": [{
        "threadFlows": [{
          "locations": [{
            "location": {
              "physicalLocation": {
                "artifactLocation": { "uri": "src/input.js" },
                "region": { "startLine": 9 }
              }
            }
          }]
        }]
      }],
      "properties": { "confidence": "HIGH", "ignored-extra": true },
      "fingerprints": { "matchBasedId/v1": "semgrep-owned-but-not-our-identity" }
    }]
  }]
}`;

const EXPECTED_FINGERPRINT = '512472179a68813d6d7f40bbf5a95a96d48b414b425283bb8a1c7edfc864f727';

function tempDirectory(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function validFinding(overrides = {}) {
  return {
    id: 'stub-finding',
    tool: 'stub',
    ruleId: 'STUB-001',
    ruleName: 'Stub finding',
    level: 'warning',
    message: 'A deterministic stub finding.',
    uri: 'src/index.js',
    startLine: 1,
    ...overrides,
  };
}

test('normalizeSarif maps realistic messy Semgrep SARIF to stable StaticFinding evidence', () => {
  const findings = normalizeSarif(JSON.parse(MESSY_SEMGREP_SARIF), { tool: 'semgrep' });
  assert.equal(findings.length, 1, 'the realistic SARIF result must stay live through normalization');
  assert.deepEqual(findings[0], {
    id: EXPECTED_FINGERPRINT,
    tool: 'semgrep',
    ruleId: 'javascript.lang.security.audit.detect-eval-with-expression',
    ruleName: 'detect-eval-with-expression',
    ruleDescription: 'Eval on dynamic input can execute attacker-controlled JavaScript.',
    level: 'error',
    message: 'Dynamic input reaches eval().',
    uri: 'src/app.js',
    startLine: 42,
    startColumn: 7,
    endLine: 42,
    snippet: 'eval(userControlledValue);',
    dataflow: JSON.parse(MESSY_SEMGREP_SARIF).runs[0].results[0].codeFlows,
    confidence: 'HIGH',
    cwe: ['CWE-95', 'CWE-94'],
    fingerprint: EXPECTED_FINGERPRINT,
  });
  assert.deepEqual(validateJsonAgainstSchema(STATIC_FINDING_SCHEMA, findings[0]), []);

  const changedSnippet = JSON.parse(MESSY_SEMGREP_SARIF);
  changedSnippet.runs[0].results[0].locations[0].physicalLocation.region.snippet.text = 'redacted-or-different';
  assert.equal(
    normalizeSarif(changedSnippet, { tool: 'semgrep' })[0].fingerprint,
    EXPECTED_FINGERPRINT,
    'killer mutation: snippet bytes must never influence D7 identity',
  );
});

test('normalizeSarif rejects malformed and unsupported SARIF envelopes', () => {
  assert.throws(() => normalizeSarif({ version: '2.1.0' }, { tool: 'semgrep' }), /missing runs array/u);
  assert.throws(
    () => normalizeSarif({ version: '9.9.9', runs: [] }, { tool: 'semgrep' }),
    /unsupported version "9\.9\.9"; expected 2\.1\.0/u,
  );
});

test('buildSemgrepArgv emits explicit OSS configs with telemetry disabled and no Pro/auto mode', () => {
  const argv = buildSemgrepArgv({
    rulesets: ['p/typescript', 'rules/local-security.yml'],
    target: 'C:\\repo',
    outFile: 'C:\\out\\semgrep.sarif',
  });
  assert.deepEqual(argv, [
    '--config',
    'p/typescript',
    '--config',
    'rules/local-security.yml',
    '--sarif',
    '--output',
    'C:\\out\\semgrep.sarif',
    '--metrics=off',
    'C:\\repo',
  ]);
  assert.equal(argv.filter((argument) => argument === '--config').length, 2, 'one --config flag per ruleset');
  assert.ok(argv.includes('--metrics=off'), 'positive liveness: the privacy flag must be present');
  assert.ok(!argv.includes('--pro'), 'Semgrep Pro is outside this OSS adapter');
  assert.ok(!argv.some((argument, index) => argument === '--config' && argv[index + 1] === 'auto'));
  assert.throws(
    () => buildSemgrepArgv({ rulesets: ['auto'], target: 'repo', outFile: 'out.sarif' }),
    /--config auto is forbidden/u,
  );
  // Locked D-P1-1: --pro is rejected as a ruleset operand — this bites the guard's removal.
  assert.throws(
    () => buildSemgrepArgv({ rulesets: ['--pro'], target: 'repo', outFile: 'out.sarif' }),
    /must not be --pro/u,
  );
});

test('the static adapter registry selects adapters from adapter-declared stacks', () => {
  const bandit = { name: 'bandit', stacks: ['python'], run: async () => [] };
  registerAdapter(bandit);
  assert.deepEqual(getAdaptersForStack('python'), [bandit]);
  assert.ok(getAdaptersForStack('ts').includes(semgrepAdapter), 'Semgrep remains live for its declared TS stack');
  assert.ok(!getAdaptersForStack('ts').includes(bandit), 'killer mutation: selection must not hardcode all adapters to TS');
});

test('S2 returns a schema-valid StaticFinding array artifact from an injected adapter', async () => {
  const stub = { name: 'stub', stacks: ['custom'], run: async () => [validFinding()] };
  const output = await s2StaticEvidence.run(
    { adapters: [stub], config: { stack: 'custom', rulesets: ['rules/stub.yml'] }, target: 'C:\\repo' },
    { target: 'redacted-persisted-scope' },
  );
  assert.deepEqual(output, { staticFindings: [validFinding()] });
  assert.deepEqual(validateJsonAgainstSchema(STATIC_FINDINGS_SCHEMA, output), []);
});

test('S2 rejects an adapter finding that violates the StaticFinding schema', async () => {
  const invalid = { name: 'invalid', stacks: ['custom'], run: async () => [{ id: 'missing-required-fields' }] };
  await assert.rejects(
    s2StaticEvidence.run(
      { adapters: [invalid], config: { stack: 'custom', rulesets: ['rules/stub.yml'] }, target: 'C:\\repo' },
      { target: 'scope' },
    ),
    /invalid StaticFinding\[0\] failed schema validation.*missing required property tool/su,
  );
});

test('security scan runs S0 -> S2 -> S3 offline and emits only structurally eligible findings', async () => {
  const repo = tempDirectory('assurance-static-repo-');
  const runRoot = tempDirectory('assurance-static-run-');
  fs.writeFileSync(path.join(repo, 'index.js'), 'export const live = true;\n', 'utf8');
  const stub = {
    name: 'offline-static',
    stacks: ['ts'],
    run: async ({ rulesets, target }) => {
      assert.deepEqual(rulesets, ['rules/offline.yml']);
      assert.equal(target, path.resolve(repo));
      return [
        validFinding({ id: 'keep', confidence: 'MEDIUM' }),
        validFinding({ id: 'none', level: 'none' }),
        validFinding({ id: 'low', confidence: 'LOW' }),
      ];
    },
  };
  const scan = await runSecurityScan({
    repo,
    runRoot,
    runId: 'offline',
    config: { stack: 'ts', rulesets: ['rules/offline.yml'] },
    adapters: [stub],
  });

  assert.deepEqual(scan.executed, [...SECURITY_STAGE_NAMES]);
  assert.equal(scan.output.staticFindings.length, 1, 'S3 keeps the medium-confidence warning');
  assert.equal(scan.output.staticFindings[0].id, 'keep');
  assert.equal(scan.emit.finding_count, 1);
  const sarifPath = path.join(scan.run_dir, scan.emit.sarif_path);
  const reportPath = path.join(scan.run_dir, scan.emit.report_path);
  assert.equal(JSON.parse(fs.readFileSync(sarifPath, 'utf8')).runs[0].results.length, 1);
  assert.match(fs.readFileSync(reportPath, 'utf8'), /STUB-001/u);
});
