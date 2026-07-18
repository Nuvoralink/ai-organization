#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha256 } from './evidence-runtime.mjs';

const caseId = 'forged-runner-attestation-rejected';
const sourceFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'evidence-runtime.mjs');
const source = fs.readFileSync(sourceFile, 'utf8');
const mutationTarget = 'return crypto.timingSafeEqual(Buffer.from(supplied, \'hex\'), Buffer.from(expected, \'hex\'));';
const mutantSource = source.replace(mutationTarget, 'return true; // killer mutation: accept every well-shaped forged receipt');
if (mutantSource === source) throw new Error('Mutation target is absent from evidence-runtime.mjs; the harness cannot prove the live verifier.');

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-integrity-mutation-'));
const baselineFile = path.join(scratch, 'evidence-runtime-baseline.mjs');
const mutantFile = path.join(scratch, 'evidence-runtime-mutant.mjs');
fs.writeFileSync(baselineFile, source);
fs.writeFileSync(mutantFile, mutantSource);

const scenario = `
const runtime = await import(process.argv[1]);
const secret = '11'.repeat(32);
const unsigned = { proof_id: 'control-plane-proof', repository: { diff_sha256: '44'.repeat(32) } };
const valid = { ...unsigned, attestation_hmac_sha256: runtime.signAttestation(unsigned, secret) };
if (!runtime.verifyAttestation(valid, secret)) { console.error('baseline signed receipt was rejected'); process.exit(2); }
const forged = structuredClone(valid);
forged.repository.diff_sha256 = '55'.repeat(32);
if (runtime.verifyAttestation(forged, secret)) { console.error('forged runner attestation was accepted'); process.exit(17); }
`;

function execute(moduleFile) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', scenario, pathToFileURL(moduleFile).href], { encoding: 'utf8', shell: false, windowsHide: true });
  return { exit_code: Number.isInteger(result.status) ? result.status : 1, diagnostic: `${result.stderr ?? ''}${result.stdout ?? ''}`.trim() };
}

try {
  const baseline = execute(baselineFile);
  const baselineDigest = sha256(fs.readFileSync(baselineFile));
  const mutant = execute(mutantFile);
  fs.copyFileSync(baselineFile, mutantFile);
  const restoredDigest = sha256(fs.readFileSync(mutantFile));
  const postRestore = execute(mutantFile);
  const receipt = {
    schema_version: 1,
    case_id: caseId,
    baseline: { exit_code: baseline.exit_code, digest: baselineDigest },
    mutant: { exit_code: mutant.exit_code, diagnostic: mutant.diagnostic },
    restored: { digest: restoredDigest },
    post_restore: { exit_code: postRestore.exit_code, digest: sha256(fs.readFileSync(mutantFile)) }
  };
  console.log(`MUTATION_RECEIPT_JSON:${JSON.stringify(receipt)}`);
  if (baseline.exit_code !== 0 || mutant.exit_code !== 17 || !mutant.diagnostic.includes('forged runner attestation was accepted') || restoredDigest !== baselineDigest || postRestore.exit_code !== 0) process.exitCode = 1;
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
