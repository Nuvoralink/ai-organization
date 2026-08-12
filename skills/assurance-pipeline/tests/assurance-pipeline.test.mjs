/**
 * Proves: Assurance Pipeline Phase 0 DoD (docs/assurance-pipeline-plan.md §12) + decisions D1
 *         (own resumable run-state store), D2 (SARIF 2.1.0), D3 (deterministic spine), D6 (mock/cli/
 *         codex-cli backends; sdk/openai off).
 * Test type: unit + integration + killer-mutation
 * Surface: skills/assurance-pipeline spine (stage-runner, run-store, backend, voting panel,
 *          estimate, redaction, SARIF + report emitters, CLI) proven by the toy 3-stage pipeline.
 * Authority: the run-manifest (checkpoint/resume), the vendored SARIF 2.1.0 schema (machine output),
 *            and redaction.mjs (persisted-artifact masking).
 * Given a deterministic mock backend, the spine runs end-to-end, checkpoints + resumes correctly,
 * emits schema-valid SARIF, previews scope with zero spend, and masks planted secrets before any
 * artifact reaches disk; if any of those regressed, the named assertions below turn red.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { redactString, redactValue, containsSensitive } from '../lib/redaction.mjs';
import { runVotingPanel } from '../lib/voting-panel.mjs';
import { createBackend } from '../lib/backend.mjs';
import { previewScope } from '../lib/estimate.mjs';
import { digestObject } from '../lib/artifacts.mjs';
import { RunStore } from '../lib/run-store.mjs';
import { runPipeline, defineStage } from '../lib/stage-runner.mjs';
import { SARIF_SCHEMA } from '../lib/paths.mjs';
import { emitSarif } from '../lib/emit-sarif.mjs';
import { runScan, runEstimate, runReport } from '../cli.mjs';
import { TOY_STAGE_NAMES } from '../pipelines/toy-pipeline.mjs';
import { validateJsonAgainstSchema } from '../../../core/schema/validate-json-schema.mjs';

// Planted secrets are assembled at runtime (mirrors the toy pipeline) so this test file, like the
// pipeline source, carries no secret-shaped literal that control:validate / gitleaks would flag.
const PLANTED_PAN = ['4111', '1111', '1111', '1111'].join('');
const PLANTED_SSN = ['078', '05', '1120'].join('-');
const PLANTED_KEY = ['sk', '-', 'toy', Buffer.from('assurance').toString('hex'), '000000'].join('');

function tempRunRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'assurance-test-'));
}

function mockBackend() {
  return createBackend({ via: 'mock' }, { hash: digestObject });
}

function countingBackend() {
  let calls = 0;
  return {
    via: 'mock',
    describe: () => ({ via: 'mock' }),
    async invoke() {
      calls += 1;
      throw new Error('this backend must not be invoked in this test');
    },
    calls: () => calls,
  };
}

// ---------------------------------------------------------------------------------------------
// Redaction (spine component d)
// ---------------------------------------------------------------------------------------------
test('redaction masks a Luhn+IIN-valid PAN, SSN, and named secret shapes', () => {
  const input = `card=${PLANTED_PAN} ssn=${PLANTED_SSN} key=${PLANTED_KEY} akia=AKIA${'A'.repeat(16)}`;
  const output = redactString(input);
  assert.ok(!output.includes(PLANTED_PAN), 'PAN must be masked');
  assert.ok(!output.includes(PLANTED_SSN), 'SSN must be masked');
  assert.ok(!output.includes(PLANTED_KEY), 'API key must be masked');
  assert.match(output, /\[REDACTED:pan\]/u);
  assert.match(output, /\[REDACTED:ssn\]/u);
  assert.match(output, /\[REDACTED:(?:api-key|secret)\]/u);
  assert.match(output, /\[REDACTED:aws-access-key-id\]/u);
});

test('redaction does NOT over-mask: a non-card 16-digit number and plain text survive', () => {
  // 1234567890123456 is not Luhn-valid; a 16-digit order id must NOT be treated as a PAN.
  const orderId = '1234567890123456';
  assert.equal(redactString(`order=${orderId}`), `order=${orderId}`);
  assert.equal(redactString('a normal sentence with no secrets'), 'a normal sentence with no secrets');
  // Killer mutation: if the Luhn/IIN gate were dropped, orderId would redact — this asserts it does not.
  assert.equal(containsSensitive(`order=${orderId}`), false);
});

test('redactValue returns a masked deep copy without mutating the input', () => {
  const original = { a: `key=${PLANTED_KEY}`, nested: { list: [`pan ${PLANTED_PAN}`] } };
  const snapshot = JSON.parse(JSON.stringify(original));
  const redacted = redactValue(original);
  assert.deepEqual(original, snapshot, 'input must not be mutated');
  assert.ok(!JSON.stringify(redacted).includes(PLANTED_PAN));
  assert.ok(!JSON.stringify(redacted).includes(PLANTED_KEY));
});

// ---------------------------------------------------------------------------------------------
// Voting panel (spine component b)
// ---------------------------------------------------------------------------------------------
test('voting panel confirms on a majority and returns needs_review below threshold', async () => {
  const confirmLens = () => ({ verdict: 'confirmed' });
  const rejectLens = () => ({ verdict: 'rejected' });
  const majority = await runVotingPanel({ lenses: [confirmLens, confirmLens, rejectLens], threshold: 2, subject: {} });
  assert.equal(majority.verdict, 'confirmed');
  assert.equal(majority.method, 'vote');

  const tie = await runVotingPanel({ lenses: [confirmLens, rejectLens], threshold: 2, subject: {} });
  assert.equal(tie.verdict, 'needs_review', 'a tie below threshold is never decisive');
});

test('voting panel at N=1 uses the deterministic fallback, never a vote-of-one', async () => {
  // The lone lens would say "confirmed"; the fallback says "rejected". The fallback must win.
  const lens = () => ({ verdict: 'confirmed' });
  const deterministicFallback = () => ({ verdict: 'rejected', role: 'det-prefilter' });
  const result = await runVotingPanel({ lenses: [lens], threshold: 1, deterministicFallback, subject: {} });
  assert.equal(result.method, 'deterministic-fallback');
  assert.equal(result.verdict, 'rejected', 'a single lens must not be trusted as a vote-of-one');
});

// ---------------------------------------------------------------------------------------------
// Backend (spine component c)
// ---------------------------------------------------------------------------------------------
test('mock backend is deterministic; cli/codex-cli are fail-closed stubs; sdk/openai are off', async () => {
  const backend = mockBackend();
  const a = await backend.invoke({ role: 'r', input: { evidence: 'x' }, seed: 1 });
  const b = await backend.invoke({ role: 'r', input: { evidence: 'x' }, seed: 1 });
  assert.deepEqual(a, b, 'identical inputs must yield identical mock output');
  assert.equal(a.grounded, true, 'a subject with evidence is grounded');

  assert.throws(() => createBackend({ via: 'cli' }).invoke(), /CAPABILITY_BLOCKED.*Phase-1 stub/su);
  assert.throws(() => createBackend({ via: 'codex-cli' }).invoke(), /CAPABILITY_BLOCKED.*UNATTESTED/su);
  assert.throws(() => createBackend({ via: 'sdk' }), /OFF by default/u);
  assert.throws(() => createBackend({ via: 'openai' }), /OFF by default/u);
});

// ---------------------------------------------------------------------------------------------
// Estimate (spine component c pre-flight) — zero backend calls
// ---------------------------------------------------------------------------------------------
test('estimate performs ZERO backend calls', () => {
  const spy = countingBackend();
  const estimate = runEstimate({ target: 'fixture@abc', backend: spy });
  assert.equal(spy.calls(), 0, 'estimate must never invoke the backend');
  assert.equal(estimate.backend_invocations, 0);
  assert.equal(estimate.model_call_count, 3, 'three verify lenses = three model calls previewed');
  assert.ok(estimate.estimated_tokens > 0 && estimate.estimated_cost_usd > 0);
});

test('previewScope is handed a throwing backend and still completes (proves it does not call it)', () => {
  const spy = countingBackend();
  const preview = previewScope({
    target: 't',
    config: {},
    stages: [{ name: 'verify', kind: 'llm', lensCount: 4 }],
    backend: spy,
  });
  assert.equal(spy.calls(), 0);
  assert.equal(preview.model_call_count, 4);
});

// ---------------------------------------------------------------------------------------------
// End-to-end toy run (stage-runner + run-store + emitters)
// ---------------------------------------------------------------------------------------------
test('toy pipeline runs end-to-end: all stages execute and checkpoint', async () => {
  const runRoot = tempRunRoot();
  const scan = await runScan({ target: 'fixture@abc', runRoot, runId: 'e2e', backend: mockBackend() });
  assert.deepEqual(scan.executed, [...TOY_STAGE_NAMES], 'a fresh run executes every stage');
  assert.deepEqual(scan.skipped, []);
  assert.equal(scan.output.confirmed_count, 2, 'F1 (secret) and F2 (dead branch) confirm; F3 (no evidence) does not');
  assert.equal(scan.output.total_count, 3);

  const store = new RunStore({ runRoot, runId: 'e2e' });
  const manifest = store.loadManifest();
  assert.equal(validateJsonAgainstSchema(SARIF_SCHEMA, JSON.parse(fs.readFileSync(path.join(scan.run_dir, 'emit', 'assurance.sarif'), 'utf8'))).length, 0);
  for (const name of TOY_STAGE_NAMES) {
    const record = manifest.stages.find((stage) => stage.name === name);
    assert.equal(record.status, 'completed', `${name} must be checkpointed`);
    assert.match(record.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(store.isStageCheckpointValid(manifest, name), `${name} checkpoint must verify`);
  }
});

// ---------------------------------------------------------------------------------------------
// Checkpoint / resume (the DoD's critical property + killer mutation)
// ---------------------------------------------------------------------------------------------
test('clean resume skips every completed stage', async () => {
  const runRoot = tempRunRoot();
  await runScan({ target: 'fixture@abc', runRoot, runId: 'resume', backend: mockBackend() });
  const again = await runScan({ target: 'fixture@abc', runRoot, runId: 'resume', backend: mockBackend() });
  assert.deepEqual(again.executed, [], 'an unchanged resume re-executes nothing');
  assert.deepEqual(again.skipped, [...TOY_STAGE_NAMES]);
});

test('killer mutation: corrupting the last stage checkpoint sha forces exactly that stage to re-run', async () => {
  const runRoot = tempRunRoot();
  const first = await runScan({ target: 'fixture@abc', runRoot, runId: 'mut', backend: mockBackend() });
  const manifestFile = path.join(first.run_dir, 'run-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.stages.find((stage) => stage.name === 'emit').sha256 = 'deadbeef'.repeat(8);
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  const rerun = await runScan({ target: 'fixture@abc', runRoot, runId: 'mut', backend: mockBackend() });
  assert.deepEqual(rerun.executed, ['emit'], 'the corrupted last stage MUST re-execute');
  assert.deepEqual(rerun.skipped, ['produce', 'verify'], 'the valid earlier stages MUST be reused');
});

test('corrupting a MIDDLE stage re-runs it AND every stage after it (dependency-correct resume)', async () => {
  const runRoot = tempRunRoot();
  const first = await runScan({ target: 'fixture@abc', runRoot, runId: 'cascade', backend: mockBackend() });
  const manifestFile = path.join(first.run_dir, 'run-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.stages.find((stage) => stage.name === 'verify').sha256 = 'deadbeef'.repeat(8);
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  const rerun = await runScan({ target: 'fixture@abc', runRoot, runId: 'cascade', backend: mockBackend() });
  assert.deepEqual(rerun.executed, ['verify', 'emit'], 'the changed stage and every stage after it re-run');
  assert.deepEqual(rerun.skipped, ['produce'], 'only the still-valid earlier stage is reused');
});

test('deleting the last stage artifact file forces it to re-run', async () => {
  const runRoot = tempRunRoot();
  const first = await runScan({ target: 'fixture@abc', runRoot, runId: 'del', backend: mockBackend() });
  fs.rmSync(path.join(first.run_dir, 'stages', 'emit.json'));
  const rerun = await runScan({ target: 'fixture@abc', runRoot, runId: 'del', backend: mockBackend() });
  assert.deepEqual(rerun.executed, ['emit']);
  assert.deepEqual(rerun.skipped, ['produce', 'verify']);
});

test('a changed config sha invalidates the whole run and re-executes every stage', async () => {
  const runRoot = tempRunRoot();
  await runScan({ target: 'fixture@abc', runRoot, runId: 'cfg', backend: mockBackend() });
  const changed = await runScan({
    target: 'fixture@abc',
    runRoot,
    runId: 'cfg',
    config: { vote_threshold: 3 },
    backend: mockBackend(),
  });
  assert.deepEqual(changed.executed, [...TOY_STAGE_NAMES], 'a config change must invalidate all checkpoints');
});

// ---------------------------------------------------------------------------------------------
// SARIF 2.1.0 output validates against the vendored schema (spine component e)
// ---------------------------------------------------------------------------------------------
test('emitted SARIF validates against the SARIF 2.1.0 schema; a broken doc is rejected', async () => {
  const runRoot = tempRunRoot();
  const scan = await runScan({ target: 'fixture@abc', runRoot, runId: 'sarif', backend: mockBackend() });
  const onDisk = JSON.parse(fs.readFileSync(path.join(scan.run_dir, 'emit', 'assurance.sarif'), 'utf8'));
  assert.deepEqual(validateJsonAgainstSchema(SARIF_SCHEMA, onDisk), [], 'persisted SARIF must be schema-valid');

  // The validator must BITE: a wrong version and an unknown property are both rejected.
  assert.ok(validateJsonAgainstSchema(SARIF_SCHEMA, { ...onDisk, version: '9.9.9' }).length > 0);
  const extra = JSON.parse(JSON.stringify(onDisk));
  extra.runs[0].results.push({ ruleId: 'x', bogus: true, message: { text: 'x' } });
  assert.ok(validateJsonAgainstSchema(SARIF_SCHEMA, extra).length > 0, 'an unknown SARIF property must be rejected');
});

// ---------------------------------------------------------------------------------------------
// Redaction on write masks the planted secret in BOTH SARIF and report (spine component d + e)
// ---------------------------------------------------------------------------------------------
test('planted secret is masked in the persisted SARIF and report; disabling redaction would reveal it', async () => {
  const runRoot = tempRunRoot();
  const scan = await runScan({ target: 'fixture@abc', runRoot, runId: 'redact', backend: mockBackend() });
  const sarifText = fs.readFileSync(path.join(scan.run_dir, 'emit', 'assurance.sarif'), 'utf8');
  const reportText = fs.readFileSync(path.join(scan.run_dir, 'emit', 'report.md'), 'utf8');

  for (const [surface, text] of [['SARIF', sarifText], ['report', reportText]]) {
    assert.ok(!text.includes(PLANTED_PAN), `${surface} must not contain the raw PAN`);
    assert.ok(!text.includes(PLANTED_SSN), `${surface} must not contain the raw SSN`);
    assert.ok(!text.includes(PLANTED_KEY), `${surface} must not contain the raw API key`);
    assert.match(text, /\[REDACTED:pan\]/u, `${surface} must show the PAN was masked`);
  }

  // Disabling redaction reveals the secret: the SAME emit content, un-redacted, contains the PAN.
  // This is the mutation the redaction-on-write pass defends against.
  const verdicts = new RunStore({ runRoot, runId: 'redact' }).readStage('verify');
  // Re-plant an unredacted finding to model "redaction disabled" and prove the emitter would leak it.
  const unredactedSarif = emitSarif({
    findings: [{ ruleId: 'R', ruleName: 'R', level: 'error', message: `card ${PLANTED_PAN}`, uri: 'u', startLine: 1, snippet: `k=${PLANTED_KEY}` }],
    tool: { name: 't' },
  });
  const rawSarifText = JSON.stringify(unredactedSarif);
  assert.ok(rawSarifText.includes(PLANTED_PAN), 'without redaction the SARIF DOES contain the secret');
  assert.ok(!redactString(rawSarifText).includes(PLANTED_PAN), 'redaction is what removes it');
  // The persisted verify artifact is also redacted (redaction-on-write covers EVERY artifact).
  assert.ok(!JSON.stringify(verdicts).includes(PLANTED_PAN), 'the persisted verify artifact is redacted too');
});

// ---------------------------------------------------------------------------------------------
// report command re-emits from persisted evidence with no re-run and no backend
// ---------------------------------------------------------------------------------------------
test('report re-emits from the persisted verify artifact with zero backend calls', async () => {
  const runRoot = tempRunRoot();
  const spy = countingBackend();
  await runScan({ target: 'fixture@abc', runRoot, runId: 'rep', backend: mockBackend() });
  // runReport takes no backend at all; prove it re-emits identical bytes from persisted evidence.
  const first = runReport({ runRoot, runId: 'rep' });
  const second = runReport({ runRoot, runId: 'rep' });
  assert.equal(first.sarif_sha256, second.sarif_sha256, 're-emit is deterministic from persisted evidence');
  assert.equal(first.confirmed_count, 2);
  assert.equal(spy.calls(), 0, 'report must not touch a backend');
});

// ---------------------------------------------------------------------------------------------
// D7: inter-stage input is always the redacted persisted artifact (fresh == resume)
// ---------------------------------------------------------------------------------------------
test('D7: a downstream stage receives the REDACTED upstream artifact on a FRESH run', async () => {
  // Without D7 (input = output), a fresh run feeds the next stage the RAW upstream value while a
  // resume feeds the redacted persisted one — a latent non-determinism for value-sensitive lenses.
  // This asserts the fresh path is already redacted; reverting to `input = output` reddens it.
  const runRoot = tempRunRoot();
  let downstreamInput;
  const upstream = defineStage({ name: 'up', kind: 'det', run: async () => ({ evidence: `card ${PLANTED_PAN}` }) });
  const downstream = defineStage({
    name: 'down',
    kind: 'det',
    run: async (ctx, input) => {
      downstreamInput = input;
      return { ok: true };
    },
  });
  const store = new RunStore({ runRoot, runId: 'd7flow' });
  await runPipeline({ store, pipeline: 'd7', config: {}, target: 't', stages: [upstream, downstream], initialInput: {}, ctx: {} });
  assert.ok(!JSON.stringify(downstreamInput).includes(PLANTED_PAN), 'downstream must NOT receive the raw PAN on a fresh run');
  assert.match(JSON.stringify(downstreamInput), /REDACTED:pan/u, 'downstream receives the redacted upstream artifact');
});
