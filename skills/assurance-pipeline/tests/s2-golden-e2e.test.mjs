/**
 * Proves: Assurance Pipeline Phase 1a — the S2 static-evidence stage closes VVAH caveat (a) on a
 *         TS/Node stack via a REAL Semgrep run (native binary or the semgrep/semgrep Docker image,
 *         D-P1-7), end to end: semgrep -> SARIF -> normalize -> StaticFinding[], with precision.
 * Test type: e2e (gated live lane — skips cleanly when no Semgrep runtime is available)
 * Surface: lib/adapters/static/semgrep.mjs runSemgrep over tests/fixtures/golden-ts-repo
 * Authority: the golden fixture + labels.json (hand-labeled ground truth) + a bundled offline rule.
 * Given the golden fixture and the bundled fixture-rules.yml, a real Semgrep run surfaces exactly the
 * two SYNTACTIC planted vulns (SQLi concat, SSRF non-constant URL) and NONE of the clean lookalikes;
 * if the adapter, the Docker mount, the SARIF normalizer, or the rule precision regressed, this fails.
 * (Semantic classes — tenant-isolation, object-scope authz — are the LLM lenses' job in Phase 1b and
 * are intentionally not asserted here; the registry rulesets p/typescript etc. run on real repos.)
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runSemgrep, detectSemgrepRuntime } from '../lib/adapters/static/semgrep.mjs';

const fixtureDir = fileURLToPath(new URL('./fixtures/golden-ts-repo', import.meta.url));
const runtime = detectSemgrepRuntime();
const skip = runtime ? false : 'no Semgrep runtime (native binary or semgrep/semgrep Docker image) — run `assurance doctor`';

test('golden e2e: a real Semgrep run finds exactly the planted syntactic vulns, not the clean lookalikes', { skip }, async () => {
  // The bundled offline rule ships inside the fixture; its path differs by runtime (mounted at /src
  // under Docker, a host path under a native binary).
  const rulePath = runtime === 'docker' ? '/src/fixture-rules.yml' : path.join(fixtureDir, 'fixture-rules.yml');
  const findings = await runSemgrep({ rulesets: [rulePath], target: fixtureDir, runtime });

  // Precision + recall against the hand-labeled ground truth.
  assert.equal(findings.length, 2, `expected exactly the 2 syntactic vulns, got ${findings.length}: ${findings.map((f) => `${f.ruleId}@${f.uri}`).join(', ')}`);
  assert.ok(
    findings.some((f) => f.ruleId === 'fixture-sql-string-concat' && f.uri === 'src/sql-injection.ts'),
    'the SQL-injection vuln must be found at a repo-relative URI',
  );
  assert.ok(
    findings.some((f) => f.ruleId === 'fixture-ssrf-fetch-nonconstant-url' && f.uri === 'src/ssrf.ts'),
    'the SSRF vuln must be found at a repo-relative URI',
  );
  assert.ok(!findings.some((f) => f.uri.includes('clean-')), 'no clean lookalike may be flagged (precision)');
  // Repo-relative URIs, never the container mount path — a finding's identity must not depend on the runtime.
  assert.ok(findings.every((f) => f.uri.startsWith('src/') && !f.uri.startsWith('/src')), 'URIs must be repo-relative, not /src/...');

  // Every finding is a well-formed, provenance-tagged StaticFinding (D7: identity is structural).
  for (const finding of findings) {
    assert.equal(finding.engine, 'oss', 'OSS engine provenance is recorded');
    assert.equal(finding.tool, 'semgrep');
    assert.match(finding.fingerprint, /^[a-f0-9]{64}$/u, 'a stable structural fingerprint');
    assert.ok(Number.isInteger(finding.startLine) && finding.startLine > 0);
  }

  // The two found classes are the ones labels.json marks as vuln for those files.
  const labels = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'labels.json'), 'utf8'));
  const vulnFiles = new Set(labels.filter((row) => row.expected === 'vuln').map((row) => row.file.replace(/^src\//u, '')));
  for (const finding of findings) {
    const base = finding.uri.split('/').pop();
    assert.ok(vulnFiles.has(base), `${base} is labeled a vuln in the ground truth`);
  }
});
